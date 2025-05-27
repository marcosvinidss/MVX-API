const { v4: uuidv4 } = require('uuid');
const jimp = require('jimp');

const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require('../models/Ad');
const StateModel = require('../models/State');

const addImage = async (buffer) => {
    let newName = `${uuidv4()}.jpg`;
    let tmpImg = await jimp.read(buffer);
    tmpImg.cover(500, 500).quality(80).write(`./public/media/${newName}`);
    return newName;
};

const parsePrice = (price) => {
    if (!price) return 0;
    price = price.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(price);
    return isNaN(num) ? 0 : num;
};

module.exports = {
    getCategories: async (req, res) => {
        const cats = await Category.find();
        let categories = cats.map(cat => ({
            ...cat._doc,
            img: `${process.env.BASE}/assets/images/${cat.slug}.png`
        }));
        res.json({ categories });
    },

    addAction: async (req, res) => {
        let { title, price, priceneg, desc, cat, token } = req.body;

        const user = await User.findOne({ token }).exec();
        if (!user) {
            res.json({ error: 'Usuário não encontrado' });
            return;
        }

        if (!title || !cat) {
            res.json({ error: 'Título e/ou categoria não foram preenchidos' });
            return;
        }

        const category = await Category.findById(cat);
        if (!category) {
            res.json({ error: 'Categoria inexistente' });
            return;
        }

        price = parsePrice(price);

        const newAd = new Ad({
            status: true,
            idUser: user._id,
            state: user.state,
            dateCreated: new Date(),
            title,
            price,
            priceNegotiable: priceneg === 'true',
            description: desc,
            views: 0,
            images: [],
            category: cat
        });

        const files = req.files?.img ? (Array.isArray(req.files.img) ? req.files.img : [req.files.img]) : [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
                const url = await addImage(file.data);
                newAd.images.push({
                    url,
                    default: newAd.images.length === 0
                });
            }
        }

        const info = await newAd.save();
        res.json({ id: info._id });
    },

    getList: async (req, res) => {
        let { sort = 'asc', offset = 0, limit = 8, q, cat, state } = req.query;
        let filters = { status: true };

        if (q) {
            filters.title = { '$regex': q, '$options': 'i' };
        }

        if (cat) {
            const c = await Category.findOne({ slug: cat }).exec();
            if (c) {
                filters.category = c._id.toString();
            }
        }

        if (state) {
            const s = await StateModel.findOne({ name: state.toUpperCase() }).exec();
            if (s) {
                filters.state = s._id.toString();
            }
        }

        const total = await Ad.countDocuments(filters);

        const adsData = await Ad.find(filters)
            .sort({ dateCreated: (sort === 'desc' ? -1 : 1) })
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .exec();

        let ads = [];

        for (let i in adsData) {
            let image = null;
            if (adsData[i].images && adsData[i].images.length > 0) {
                let defaultImg = adsData[i].images.find(e => e.default);
                if (defaultImg) {
                    image = `${process.env.BASE}/media/${defaultImg.url}`;
                } else {
                    image = `${process.env.BASE}/media/${adsData[i].images[0].url}`;
                }
            }

            ads.push({
                id: adsData[i]._id,
                title: adsData[i].title,
                price: adsData[i].price,
                priceNegotiable: adsData[i].priceNegotiable,
                image
            });
        }

        res.json({ ads, total });
    },

    getItem: async (req, res) => {
        let { id, other = null } = req.query;

        if (!id || id.length < 12) {
            res.json({ error: 'ID inválido ou ausente' });
            return;
        }

        const ad = await Ad.findById(id);
        if (!ad) {
            res.json({ error: 'Produto Inexistente' });
            return;
        }

        ad.views++;
        await ad.save();

        let images = [];
        if (ad.images && ad.images.length > 0) {
            images = ad.images.map(img => `${process.env.BASE}/media/${img.url}`);
        }

        const category = await Category.findById(ad.category);
        const userInfo = await User.findById(ad.idUser);
        const stateInfo = await StateModel.findById(ad.state);

        let others = [];

        if (other) {
            const otherData = await Ad.find({ status: true, idUser: ad.idUser }).exec();

            for (let i in otherData) {
                if (otherData[i]._id.toString() !== ad._id.toString()) {
                    let image = null;
                    if (otherData[i].images && otherData[i].images.length > 0) {
                        let defaultImg = otherData[i].images.find(e => e.default);
                        if (defaultImg) {
                            image = `${process.env.BASE}/media/${defaultImg.url}`;
                        } else {
                            image = `${process.env.BASE}/media/${otherData[i].images[0].url}`;
                        }
                    }

                    others.push({
                        id: otherData[i]._id,
                        title: otherData[i].title,
                        price: otherData[i].price,
                        priceNegotiable: otherData[i].priceNegotiable,
                        image
                    });
                }
            }
        }

        res.json({
            id: ad._id,
            title: ad.title,
            price: ad.price,
            priceNegotiable: ad.priceNegotiable,
            description: ad.description,
            dateCreated: ad.dateCreated,
            views: ad.views,
            images,
            category,
            userInfo: {
                name: userInfo.name,
                email: userInfo.email
            },
            stateName: stateInfo.name,
            others
        });
    },

    editAction: async (req, res) => {
        const { id } = req.params;
        let { title, status, price, priceneg, desc, cat, images, token } = req.body;

        if (!id || id.length < 12) {
            res.json({ error: 'Id inválido' });
            return;
        }

        const ad = await Ad.findById(id);
        if (!ad) {
            res.json({ error: 'Anúncio Inexistente' });
            return;
        }

        const user = await User.findOne({ token });
        if (!user || user._id.toString() !== ad.idUser.toString()) {
            res.json({ error: 'Este anúncio não é seu!' });
            return;
        }

        let updates = {};
        if (title) updates.title = title;
        if (price) updates.price = parsePrice(price);
        if (priceneg !== undefined) updates.priceNegotiable = priceneg === 'true';
        if (status !== undefined) updates.status = status;
        if (desc) updates.description = desc;
        if (cat) {
            const category = await Category.findOne({ slug: cat });
            if (!category) {
                res.json({ error: 'Categoria inexistente' });
                return;
            }
            updates.category = category._id.toString();
        }
        if (images) updates.images = images;

        await Ad.findByIdAndUpdate(id, { $set: updates });

        if (req.files && req.files.img) {
            const adUpdated = await Ad.findById(id);
            const files = Array.isArray(req.files.img) ? req.files.img : [req.files.img];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
                    const url = await addImage(file.data);
                    adUpdated.images.push({
                        url,
                        default: adUpdated.images.length === 0
                    });
                }
            }
            await adUpdated.save();
        }

        res.json({ error: '' });
    }
};

const{validationResult, matchedData} = require('express-validator');
const bcrypt = require ('bcrypt')
const mongoose = require ('mongoose')


const State = require('../models/State');
const User = require ('../models/User');
const Category = require ('../models/Category');
const Ad = require ('../models/Ad');

module.exports ={
        getStates: async(req, res)=>{
                let states = await State.find();
                res.json({states });

        },

        info: async(req, res)=>{
                let token = req.query.token;

                const user = await User.findOne({token});
                const state = await State.findById(user.state);
                const ads = await Ad.find({idUser: user._id.toString()});

                let adList =[];
                for(let i in ads){
                        const cat= await Category.findById(ads[i].category);
                        adList.push({
                                id: ads[i]._id,
                                status: ads[i].status,
                                images: ads[i].images,
                                dateCreated: ads[i].dateCreated,
                                title: ads[i].title,
                                price:ads[i].price,
                                priceNegotiable: ads[i].priceNegotiable,
                                description: ads[i].description,
                                views: ads[i].views,
                                category: cat.slug
                
                        });
                }

                res.json({
                        name: user.name,
                        email: user.email,
                        state: state.name,
                        ads: adList
                });
        },
        editAction: async(req, res)=>{
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ error: errors.mapped() });
                }
                
                const data = matchedData(req);

                const user = await User.findOne({token: data.token});
                
                
                let updates = {};

                if(data.name){
                        updates.name = data.name;
                }
                

                if(data.email){
                        const emailCheck = await User.findOne({email: data.email});
                        if(emailCheck){
                                res.json({error: "Email já existente"});
                                return;
                        }
                        updates.email = data.email;
                }


                if (data.state) {
                        if (!mongoose.Types.ObjectId.isValid(data.state)) {
                            return res.json({ error: 'Código de estado inválido' });
                        }
                
                        const stateCheck = await State.findById(data.state);
                        if (!stateCheck) {
                            return res.json({ error: 'Estado não existe' });
                        }
                
                        updates.state = data.state; 
                    }


        if(data.password){
                updates.passwordHash = await bcrypt.hash(data.password, 10);
        }

                await User.findOneAndUpdate({token: data.token} , {$set: updates})


                res.json({ data });
        },  
};
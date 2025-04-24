const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

constmodelSchema = new mongoose.Schema({
    idUser: String,
    state: String,
    category: String,
    images: [Object],
    dateCreate: Date,
    title: String,
    price: Number,
    priceNegotiable: Boolean, 
    description: String,
    views: Number,
    status: String

});


const modelName = 'Ad';

if(mongoose.connection && mongoose.connectionmodels[modelName]){
    module.exports = mongoose.connectionmodels[modelName];
}else{
    module.exports = mongoose.model(modelName, modelSchema);
}
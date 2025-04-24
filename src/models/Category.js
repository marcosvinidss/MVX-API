const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

constmodelSchema = new mongoose.Schema({
    name: String,
    slug: String
});


const modelName = 'Category';

if(mongoose.connection && mongoose.connectionmodels[modelName]){
    module.exports = mongoose.connectionmodels[modelName];
}else{
    module.exports = mongoose.model(modelName, modelSchema);
}
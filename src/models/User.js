const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

constmodelSchema = new mongoose.Schema({
    name: String,
    email: String,
    state: String,
    password: String,
    token: String
});


const modelName = 'User';

if(mongoose.connection && mongoose.connectionmodels[modelName]){
    module.exports = mongoose.connectionmodels[modelName];
}else{
    module.exports = mongoose.model(modelName, modelSchema);
}
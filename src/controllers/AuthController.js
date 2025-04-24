const mongoose = require ('mongoose');
const bcrypt = require ('bcrypt')
const{validationResult, matchedData} = require('express-validator');

const User = require ('../models/User');    
const State = require ('../models/State');    



module.exports ={
    signin: async(req, res)=>{

    },
    signup: async (req, res)=>{
       const errors = validationResult(req);   
       if(!errors.isEmpty()){
         res.json({error: errors.mapped()});
         return;
    }

    const data = matchedData(req);

    const user = await User.findOne({
        email:data.email
    });
    if(user){
        res.json({
            error:{email:{msg:'O E-mail já existe!'}}
        });
        return;
    }



    if (!mongoose.Types.ObjectId.isValid(data.state)) {
        res.json({
            error: { state: { msg: 'Código de estado inválido' } }
        });
        return;
    }
    
    const stateItem = await State.findById(data.state);
    if (!stateItem) {
        res.json({
            error: { state: { msg: 'O Estado não existe' } }
        });
        return;
    }

    const passwordHash = await bcrypt.hash(data.password,10);
    
    const payload = (Date.now() + Math.random()).toString();
    const token = await bcrypt.hash(payload, 10);
    

    const newUser = new User({
        name: data.name,
        email: data.email,
        password: passwordHash,
        token,
        state: data.state
    });
    await newUser.save();  
    res.json({token});
        
    }
};
// createAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./src/models/User"); // ajuste o caminho se necessário

async function run() {
  try {
    const mongoUrl = process.env.DATABASE || "mongodb://127.0.0.1:27017/mvx";
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // CONFIGURE AQUI os dados do admin que quer criar/atualizar:
    const adminEmail = "admin@mvx.com";
    const adminName = "Administrador";
    const adminPlainPassword = "1234"; // senha que você quer usar (texto puro)
    const adminState = "DF"; // ajusta conforme seu schema (se obrigatório)

    // Gera hash da senha
    const passwordHash = await bcrypt.hash(adminPlainPassword, 10);

    // Verifica se já existe um usuário com esse email
    let user = await User.findOne({ email: adminEmail });

    if (user) {
      // Atualiza para ser admin e atualiza senha/token
      user.name = adminName;
      user.password = passwordHash;
      user.role = "admin"; // usa role (user/admin)
      // cria token de sessão (opcional)
      const payload = (Date.now() + Math.random()).toString();
      user.token = await bcrypt.hash(payload, 10);
      if (adminState) user.state = adminState;
      await user.save();
      console.log("✅ Usuário existente atualizado para admin:", adminEmail);
    } else {
      // Cria novo usuário admin
      const payload = (Date.now() + Math.random()).toString();
      const token = await bcrypt.hash(payload, 10);

      user = new User({
        name: adminName,
        email: adminEmail,
        password: passwordHash,
        token,
        state: adminState,
        role: "admin",
      });

      await user.save();
      console.log("✅ Novo admin criado:", adminEmail);
    }

    console.log("E-mail:", user.email);
    console.log("Senha (texto puro):", adminPlainPassword);
    console.log("Token gerado:", user.token);
    process.exit(0);
  } catch (err) {
    console.error("Erro ao criar/atualizar admin:", err);
    process.exit(1);
  }
}

run();

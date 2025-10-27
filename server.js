require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fileupload = require("express-fileupload");
const http = require("http");
const { Server } = require("socket.io");

const apiRoutes = require("./src/routes.js");

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.Promise = global.Promise;
mongoose.connection.on("error", (error) => {
  console.log("Erro: ", error.message);
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());
app.use(express.static(__dirname + "/public"));
app.use("/media", express.static(__dirname + "/public/media"));

// rotas REST normais
app.use("/", apiRoutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // troque pro domínio do front em produção
    methods: ["GET", "POST"]
  }
});

// ✅ Agora o socket não salva no banco — apenas retransmite a mensagem
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("join_ad_room", ({ adId }) => {
    const roomName = `ad_${adId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} entrou na sala ${roomName}`);
  });

  socket.on("send_message", (data) => {
    if (!data || !data.adId) return;

    const roomName = `ad_${data.adId}`;
    io.to(roomName).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`- Rodando no endereço: ${process.env.BASE}`);
});

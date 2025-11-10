const express = require("express");
const router = express.Router();

// ==============================
// MOCK DE PAGAMENTO SEGURO
// ==============================

// Criar um pagamento simulado (checkout fake)
router.post("/mock/create", async (req, res) => {
  const { adId, amount, buyerEmail } = req.body;

  if (!adId || !amount) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  // Simula criação do pagamento
  const fakePaymentId = "MOCK_" + Date.now();

  // Retorna o link de checkout simulado
  return res.json({
    paymentId: fakePaymentId,
    checkoutUrl: `${process.env.BASE_FRONT || "http://localhost:3000"}/mock-checkout?pid=${fakePaymentId}&adId=${adId}&amount=${amount}`,
  });
});

// Confirmar pagamento (simula callback de aprovação)
router.post("/mock/confirm", async (req, res) => {
  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: "ID do pagamento ausente." });
  }

  return res.json({
    ok: true,
    paymentId,
    status: "approved",
    message: "Pagamento simulado aprovado com sucesso!",
  });
});

module.exports = router;

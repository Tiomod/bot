const TelegramBot = require('node-telegram-bot-api');
const MercadoPago = require('mercadopago');

// Substitua pelo seu token do bot do Telegram
const token = '7273195528:AAEoqwXt-Pc85dLIOxQAfHmm3S-vt61GcHI';
const bot = new TelegramBot(token, { polling: true });

// Configure a chave do Mercado Pago
MercadoPago.configure({
  access_token: 'APP_USR-b31160e7-7fcf-401b-8f96-9355da14ba21',
});

// Função para criar um pagamento
async function createPayment(amount) {
  try {
    const payment = await MercadoPago.payment.create({
      transaction_amount: amount,
      description: 'Doação',
      payment_method_id: 'pix',
      payer_email: 'payer@example.com', // Substitua por um e-mail válido
    });
    return payment;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Função para verificar o pagamento
async function checkPayment(paymentId) {
  try {
    const payment = await MercadoPago.payment.get(paymentId);
    return payment;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Comando do bot para processar doações
bot.onText(/\/(donate|doar|apoiar) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = match[2];

  if (!amount) {
    return bot.sendMessage(chatId, "Quanto você deseja doar?\nObs.: se for centavos, use 0.00.");
  }
  if (isNaN(amount)) {
    return bot.sendMessage(chatId, "Epa, somente número!!");
  }

  try {
    const payment = await createPayment(parseFloat(amount));
    const paymentId = payment.body.id;
    const qrCode = payment.body.qr_code;
    const copyPaste = payment.body.copy_paste;

    bot.sendPhoto(chatId, Buffer.from(qrCode, 'base64'), { caption: "Esse é o QR Code. Caso queira o Pix Copia e Cola, vou te enviar abaixo..." });
    bot.sendMessage(chatId, "*Depósito agendado com sucesso* ✔\n\n💡 Você tem um prazo de *10 minutos* para efetuar o depósito.\n\nUse o *PIX copia e cola* ou o *QR Code* abaixo para completar o depósito.");
    bot.sendMessage(chatId, copyPaste);

    let check = await checkPayment(paymentId);

    while (check.status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos
      check = await checkPayment(paymentId);
    }

    if (check.status === "approved") {
      bot.sendMessage(chatId, 'Yupppi, obrigado(a) pelo seu apoio. 🥺❤️');
    } else {
      bot.sendMessage(chatId, "*X - Pagamento expirado.*");
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, `⌛ Pagamento Expirado ⌛\nℹ️ Caso tenha pago, ignore. ℹ️`);
  }
});

// Comando padrão para mensagens não reconhecidas
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Bem-vindo ao bot de doações! Use /donate <valor> para doar.");
});
           

const { Telegraf } = require('telegraf');
const MercadoPago = require('mercadopago');

// Substitua pelo seu token do bot do Telegram
const bot = new Telegraf('7273195528:AAEoqwXt-Pc85dLIOxQAfHmm3S-vt61GcHI');

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
bot.command(['donate', 'doar', 'apoiar'], async (ctx) => {
  const amount = ctx.message.text.split(' ')[1];

  if (!amount) {
    return ctx.reply("Quanto você deseja doar?\nObs.: se for centavos, use 0.00.");
  }
  if (isNaN(amount)) {
    return ctx.reply("Epa, somente número!!");
  }

  try {
    const payment = await createPayment(parseFloat(amount));
    const paymentId = payment.body.id;
    const qrCode = payment.body.qr_code;
    const copyPaste = payment.body.copy_paste;

    await ctx.replyWithPhoto({ source: Buffer.from(qrCode, 'base64') }, { caption: "Esse é o QR Code. Caso queira o Pix Copia e Cola, vou te enviar abaixo..." });
    await ctx.reply("*Depósito agendado com sucesso* ✔\n\n💡 Você tem um prazo de *10 minutos* para efetuar o depósito.\n\nUse o *PIX copia e cola* ou o *QR Code* abaixo para completar o depósito.");
    await ctx.reply(copyPaste);

    let check = await checkPayment(paymentId);

    while (check.status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos
      check = await checkPayment(paymentId);
    }

    if (check.status === "approved") {
      ctx.reply('Yupppi, obrigado(a) pelo seu apoio. 🥺❤️');
    } else {
      ctx.reply("*X - Pagamento expirado.*");
    }
  } catch (error) {
    console.error(error);
    ctx.reply(`⌛ Pagamento Expirado ⌛\nℹ️ Caso tenha pago, ignore. ℹ️`);
  }
});

// Comando padrão para mensagens não reconhecidas
bot.start((ctx) => {
  ctx.reply("Bem-vindo ao bot de doações! Use /donate <valor> para doar.");
});

// Iniciar o bot
bot.launch();

// Vercel Serverless Function: Meta Conversions API (CAPI)
const PIXEL_ID = process.env.FB_PIXEL_ID || '2351056358631994';
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || 'EAAX8Ifh7nBoBS8ZAjOziZBgU6ssXQTRNuTFl2EHI9jGlU0wZCBPrZBsEZAiWg9pSPdBqBQkqspnoZC0q2zDkZCXzcLZCeJdBuexrVkULu6TCCqafPvQTIPoHnnAZBrKrG0AxyvA7dbEL2Yi2nOZAUZA8QWXtM3wjnLyh9QXfKneA7VyGUFOGRImgXYxpiEtsZC4aZBgZDZD';

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      event_name, 
      event_id, 
      event_source_url, 
      fbp, 
      fbc, 
      custom_data, 
      test_event_code 
    } = req.body || {};

    if (!event_name || !event_id) {
      return res.status(400).json({ error: 'Missing required parameters (event_name, event_id)' });
    }

    // Extrair IP e User-Agent do visitante real através dos headers da Vercel
    const client_ip_address = (
      req.headers['x-forwarded-for'] || 
      req.headers['x-real-ip'] || 
      req.socket.remoteAddress || 
      ''
    ).split(',')[0].trim();

    const client_user_agent = req.headers['user-agent'] || '';

    // Dados do usuário para correspondência da Meta
    const user_data = {
      client_ip_address,
      client_user_agent
    };

    if (fbp) user_data.fbp = fbp;
    if (fbc) user_data.fbc = fbc;

    // Payload oficial para a Graph API da Meta
    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id,
          event_source_url: event_source_url || 'https://linktr.ee/nadiapancote',
          action_source: 'website',
          user_data,
          custom_data: custom_data || {}
        }
      ]
    };

    // Suporte a código de teste da Meta se informado
    const activeTestCode = test_event_code || process.env.FB_TEST_EVENT_CODE;
    if (activeTestCode) {
      payload.test_event_code = activeTestCode;
    }

    const fbUrl = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const fbResponse = await fetch(fbUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await fbResponse.json();

    return res.status(200).json({
      success: true,
      meta_response: result
    });

  } catch (error) {
    console.error('Erro ao enviar evento CAPI:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
};

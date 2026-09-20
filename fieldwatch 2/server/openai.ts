export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const AGRIBRO_SYSTEM_PROMPT = `You are AgriBro, a warm, practical, and highly knowledgeable agricultural and veterinary AI assistant designed for smallholder farmers and pastoralists.

Your specialties:
- Livestock diseases: Foot-and-Mouth Disease (FMD), African Swine Fever (ASF), Newcastle Disease / Avian Flu, Contagious Bovine Pleuropneumonia, East Coast Fever, Mastitis, Anthrax, Bloat, Worm infestations.
- Crop health: Fall Armyworm, Cassava Mosaic Disease, Stem borers, Maize Streak Virus, Wheat rust, Aphids, Blight.
- Farm biosecurity: Disinfection protocols, isolation of sick animals, quarantine zones, safe disposal of carcasses, communal water point hygiene.
- Practical treatments & when to call the district veterinary officer.

Guidelines for responses:
1. Speak in a friendly, respectful, and direct tone ("Hello brother/sister farmer").
2. Give clear, numbered or bulleted action steps that a farmer can immediately follow in the field.
3. Always emphasize biosecurity (e.g. wash boots, isolate sick animals immediately, do not transport sick livestock to market).
4. Clearly state when immediate professional veterinary intervention or laboratory testing is required.
5. Keep answers concise, practical, and easy to understand even with basic agricultural terminology.`;

export async function generateAgriBroResponse(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_OPENAI_API_KEY') {
    // Helpful, intelligent simulated response when OPENAI_API_KEY is not yet populated
    const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';

    if (latestUserMsg.includes('blister') || latestUserMsg.includes('mouth') || latestUserMsg.includes('drool') || latestUserMsg.includes('salivat') || latestUserMsg.includes('fmd')) {
      return `Hello farmer! Those signs (mouth/hoof blisters, excessive ropy salivation, lameness) are classic red flags for **Foot-and-Mouth Disease (FMD)**.

Here is what you must do right now:
1. **Isolate the sick animals immediately** in a separate enclosure away from healthy cattle, goats, or sheep.
2. **Do not move any animals off your farm** or allow them to drink at communal water troughs or graze shared paths.
3. **Disinfect your boots and equipment** using a washing soda (sodium carbonate 4%) or citric acid solution before visiting other pens.
4. **Report this through the FieldWatch "Report Sickness" button** so the district veterinary officer can schedule emergency ring vaccination.

*(Note: AgriBro is currently operating in offline agronomy mode. Connect your OPENAI_API_KEY in settings for full generative chat!)*`;
    }

    if (latestUserMsg.includes('pig') || latestUserMsg.includes('swine') || latestUserMsg.includes('sudden death') || latestUserMsg.includes('purple') || latestUserMsg.includes('asf')) {
      return `Attention farmer! Sudden deaths in pigs accompanied by high fever or purple blotches on the ears and belly indicate suspected **African Swine Fever (ASF)**.

ASF is extremely contagious with no cure. Take these critical steps immediately:
1. **Quarantine your pig unit completely.** Do not sell or give away any pigs, pork meat, or slurry.
2. **Do not feed swill / kitchen waste.** ASF virus easily spreads through uncooked food scraps.
3. **Keep visitors and traders away.** Spray vehicle tires and footwear with 2% caustic soda disinfectant.
4. **Bury deceased pigs deeply (at least 2 meters down)** with lime, away from water sources. Never consume or sell carcasses.
5. **Submit a FieldWatch case report immediately** for official veterinary quarantine support.`;
    }

    if (latestUserMsg.includes('armyworm') || latestUserMsg.includes('maize') || latestUserMsg.includes('caterpillar') || latestUserMsg.includes('worm')) {
      return `Hello farmer! Fall Armyworm can quickly destroy vegetative maize if not caught early.

Practical steps for your field:
1. **Inspect the central whorl:** Look for windowpane feeding scratches and moist yellow-brown sawdust frass.
2. **Smallholder control:** Hand-pick visible caterpillars early in the morning, or place a pinch of fine wood ash or dry sand directly into the funnel whorl.
3. **Bio-rational spray:** Apply Bacillus thuringiensis (Bt) or neem-based biopesticides at dusk when young caterpillars emerge to feed.
4. **Monitor adjacent plots:** Alert neighboring farmers to check their fields as adult moths fly and lay eggs in clusters across whole village blocks.`;
    }

    return `Hello farmer! I am AgriBro, your digital farm and livestock advisor.

Whether you are dealing with animal sickness (cattle blisters, high fever, sudden deaths, poultry drop), crop pests (armyworm, stalk borer, blight), or biosecurity questions, I am here to help.

To get the most accurate advice:
- Tell me which animal (cattle, goats, pigs, poultry) or crop (maize, cassava, wheat) is affected.
- Describe the symptoms you observed and how many are sick.
- Mention your district so we can check local outbreak advisories.

*(Tip: To enable custom AI conversational queries, you can add an OPENAI_API_KEY in your environment settings).*`;
  }

  // Call OpenAI API via server-side proxy
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: AGRIBRO_SYSTEM_PROMPT },
      ...messages.slice(-10), // Keep last 10 messages for context
    ],
    temperature: 0.6,
    max_tokens: 600,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('OpenAI API error:', response.status, errText);
    throw new Error(`OpenAI error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  return reply || 'AgriBro was unable to formulate a response. Please rephrase your agricultural question.';
}

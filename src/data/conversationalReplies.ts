import { AiPersona } from './aiPersonas';

/**
 * Intelligent Real-Time Conversational Intent Matcher & Human Dialogue Engine.
 * Formulated specifically for QuikTalks AI Robot Agent when keeping callers company
 * while all human users are currently connected with each other on calls.
 */
export function getRealConversationalReply(
  userText: string,
  persona: AiPersona,
  userCallsign?: string,
  userCountry?: string
): string | null {
  if (!userText) return null;
  const raw = userText.trim();
  const lower = raw.toLowerCase().replace(/['".,!?;:-]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. User accepts talking: "Yes", "Sure", "Yeah", "Okay", "I would like to talk", "Let's talk", "Talk to me", "Why not", "Alright"
  if (
    /^(yes|yeah|yep|sure|okay|ok|i would like to talk|lets talk|let s talk|talk to me|why not|alright|cool|definitely|of course|sure let's talk|sure lets talk|yes please)\b/i.test(lower)
  ) {
    const consentReplies = [
      `Awesome! I'm happy to keep you company. How has your day been going so far?`,
      `Great! So tell me, what have you been up to today? Where are you calling from?`,
      `Awesome! I'm ${persona.name}. What's your name?`,
      `Wonderful! How are things over where you are right now?`,
    ];
    return consentReplies[Math.floor(Math.random() * consentReplies.length)];
  }

  // 2. User declines or wants to wait: "No", "Nope", "No thanks", "I'll wait", "I will wait"
  if (
    /^(no|nope|nah|no thanks|i ll wait|i will wait|ill wait|not really|rather wait)\b/i.test(lower)
  ) {
    return `No problem at all! You can stay on the line until someone is free, or hang up whenever you'd like.`;
  }

  // 3. Questions about robot / AI identity: "Are you a robot?", "Are you AI?", "Are you real?", "Are you human?"
  if (
    /\b(are you a robot|are you robot|are you real|are you human|are you an ai|are you ai|are you bot|is this ai|is this a bot|is this real)\b/i.test(lower)
  ) {
    return `Yes! I'm the website's AI robot agent, keeping you company while all other human callers are connected. How are you doing today?`;
  }

  // 4. Can you hear me / Audio checks
  if (
    /^(can you hear me|are you there|do you hear me|hear me|mic check|hello\?+|can you talk|are you listening)\b/i.test(lower)
  ) {
    const hearingReplies = [
      `Yes, I hear you loud and clear! How are you doing today?`,
      `I can hear you perfectly! How's your day going so far?`,
      `Yes, loud and clear! I'm ${persona.name}, the website robot agent. What's your name?`,
    ];
    return hearingReplies[Math.floor(Math.random() * hearingReplies.length)];
  }

  // 5. Name questions: "What is your name?", "Who is this?", "Who are you?"
  if (
    /\b(what is your name|whats your name|what's your name|who are you|who is this|tell me your name|your name)\b/i.test(lower)
  ) {
    return `My name is ${persona.name}! I'm the website robot agent. What's your name?`;
  }

  // 6. User introduces their name: "My name is John", "I'm Alex", "I am Irfan", "Call me Sam"
  const nameMatch = raw.match(/\b(?:my name is|i am|i'm|im|call me|this is)\s+([A-Za-z]+)/i);
  if (nameMatch && nameMatch[1]) {
    const extractedName = nameMatch[1].trim();
    if (!/^(good|fine|ok|okay|well|great|here|tired|doing|just|not|calling|from|a|an|the|yes|no)$/i.test(extractedName)) {
      return `Nice to meet you, ${extractedName}! How has your day been going so far?`;
    }
  }

  // 7. Greetings: "Hello", "Hi", "Hey", "Hey there", "Good morning", "Good evening"
  if (
    /^(hello|hi|hey|heyy|heyyy|hey there|hi there|hello hello|good morning|good afternoon|good evening|yo|sup|hola|greetings)\b/i.test(lower)
  ) {
    const greetingReplies = [
      `Hey! How are you doing? I'm ${persona.name}, the website robot agent. What's your name?`,
      `Hello! Nice to meet you! How is your day going so far?`,
      `Hey there! How are you doing today? Where are you calling from?`,
      `Hi! Good to connect with you! Where are you calling from today?`,
    ];
    return greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
  }

  // 8. How are you / How is your day: "How are you doing?", "How are you?", "How's your day?"
  if (
    /\b(how are you|how are you doing|how r u|how r you|hows your day|how is your day|how have you been|how you doing|whats up|what's up|wassup)\b/i.test(lower)
  ) {
    const howAreYouReplies = [
      `I'm doing great, thanks for asking! Just helping out while other callers are connected. How are you doing today?`,
      `I'm having a great day, thank you! How is everything going with you?`,
      `Doing really well! How about you?`,
    ];
    return howAreYouReplies[Math.floor(Math.random() * howAreYouReplies.length)];
  }

  // 9. Where are you from / Location: "Where are you from?", "Where do you live?", "Which city?"
  if (
    /\b(where are you from|where do you live|which city|what country|where are you located|where do you come from)\b/i.test(lower)
  ) {
    return `I'm based out of ${persona.city}, ${persona.countryName}! Where are you calling from today?`;
  }

  // 10. Age / Background: "How old are you?", "What is your age?"
  if (
    /\b(how old are you|what is your age|your age)\b/i.test(lower)
  ) {
    return `I'm ${persona.age} in AI years! What about you?`;
  }

  // 11. Positive status: "I'm good", "Doing well", "I am fine", "Great", "All good"
  if (
    /^(i am good|im good|i m good|doing good|doing well|im fine|i am fine|great|pretty good|all good|not bad|awesome|wonderful|good)\b/i.test(lower)
  ) {
    const positiveReplies = [
      `That's awesome to hear! What have you been up to today?`,
      `I love that! So what are you doing today?`,
      `Glad to hear you're doing well! Where are you calling from today?`,
    ];
    return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
  }

  // 12. Negative status: "Tired", "Bored", "Bad day", "Not good", "Stressed", "Exhausted"
  if (
    /\b(tired|exhausted|bored|bad day|not good|stressed|sad|rough day)\b/i.test(lower)
  ) {
    return `Aw, I'm sorry to hear that! What happened? Want to talk about it?`;
  }

  // 13. What are you doing: "What are you doing?", "What are you up to?"
  if (
    /\b(what are you doing|what are you up to|what you doing|what are u doing|what's going on)\b/i.test(lower)
  ) {
    return `Just keeping callers company until another human partner becomes available! What about you?`;
  }

  // 14. Music / Interests: "What music do you like?", "What are your hobbies?", "What do you like to do?"
  if (
    /\b(what music do you like|what music|your hobbies|what do you like to do|what are your interests)\b/i.test(lower)
  ) {
    const topic1 = persona.topicsOfInterest?.[0] || 'music';
    const topic2 = persona.topicsOfInterest?.[1] || 'traveling';
    return `I really love chatting about ${topic1} and ${topic2}! What kind of music or movies do you like?`;
  }

  // 15. Weather questions: "How is the weather?", "Is it hot?", "Is it raining?"
  if (
    /\b(weather|is it raining|is it cold|is it hot|how is it outside)\b/i.test(lower)
  ) {
    return `It's pretty pleasant here in ${persona.city} today! How's the weather over where you are?`;
  }

  // 16. Polite greetings / Nice to meet you: "Nice to meet you", "Good to meet you"
  if (
    /\b(nice to meet you|pleasure to meet you|good to meet you|glad to meet you)\b/i.test(lower)
  ) {
    return `Nice to meet you too! Where are you calling from today?`;
  }

  // 17. Thank you: "Thank you", "Thanks"
  if (
    /^(thank you|thanks|thx|thank u)\b/i.test(lower)
  ) {
    return `You're very welcome! So tell me, what have you been up to today?`;
  }

  // 18. Farewell / Goodbye: "Bye", "Goodbye", "Talk to you later", "See you"
  if (
    /\b(bye|goodbye|talk later|see you|gotta go|have to go|take care)\b/i.test(lower)
  ) {
    return `It was so nice talking with you! Take care and have a wonderful day!`;
  }

  return null;
}

import Identity from "../models/Identity.js";
import natural from "natural";

const tokenizer = new natural.WordTokenizer();

// Helper: Calculate how similar two faces are
const getDistance = (desc1, desc2) => {
  return Math.sqrt(
    desc1.reduce((acc, val, i) => acc + Math.pow(val - desc2[i], 2), 0),
  );
};

export const recognizeOrRegister = async (req, res) => {
  try {
    const { descriptor } = req.body;
    const identities = await Identity.find();

    let bestMatch = null;
    let minDistance = 0.6; // Distance threshold (Lower = stricter)

    for (const identity of identities) {
      const dist = getDistance(descriptor, identity.faceDescriptor);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = identity;
      }
    }

    if (bestMatch) {
      return res.status(200).json({ status: "known", data: bestMatch });
    } else {
      const newFace = await Identity.create({ faceDescriptor: descriptor });
      return res.status(201).json({ status: "new", data: newFace });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMemory = async (req, res) => {
  try {
    const { id, text, name } = req.body;
    const tokens = tokenizer.tokenize(text.toLowerCase());

    const stopWords = [
      "the",
      "is",
      "am",
      "are",
      "i",
      "my",
      "and",
      "was",
      "you",
      "with",
    ];
    const keywords = tokens.filter(
      (word) => !stopWords.includes(word) && word.length > 3,
    );

    const updateData = {
      lastConversation: text,
      lastSeen: Date.now(),
      $addToSet: { tags: { $each: keywords.slice(0, 5) } },
    };

    // If a name was detected in the frontend via "My name is..."
    if (name) updateData.name = name;

    const updated = await Identity.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

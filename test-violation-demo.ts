/**
 * VIOLATION DEMO FILE - DELIBERATELY CONTAINS HARDCODED VALUES
 * ============================================================
 * 
 * PURPOSE: Demonstrate the enforcement system blocks violations
 * STATUS: This file should be BLOCKED by the prevention system
 */

// VIOLATION 1: Hardcoded provider name
const aiConfig = {
  provider: "openai",  // This should be BLOCKED
  model: "gpt-4",      // This should be BLOCKED
  apiKey: "sk-1234567890abcdef1234567890abcdef" // This should be BLOCKED
};

// VIOLATION 2: Direct API call
const directCall = async () => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // This should be BLOCKED
    }
  });
  return response.json();
};

// VIOLATION 3: Hardcoded model selection
function selectModel() {
  const model = "gpt-4"; // This should be BLOCKED
  return model;
}

// VIOLATION 4: Non-deterministic functions
function generateId() {
  return Math.random().toString(36); // This should be BLOCKED
}

// VIOLATION 5: Hardcoded localhost URL  
const apiUrl = "http://localhost:3000/api"; // This should be BLOCKED

console.log("🚨 DEMO FILE: This file contains deliberate violations");
console.log("🚨 DEMO FILE: The enforcement system should block this file");
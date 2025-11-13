/**
 * Generates a random 16-character alphanumeric ID
 * @returns {string} A unique random ID
 */
export function randomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    id += chars[randomIndex];
  }
  
  return id;
}
// Fichier d'entrée pour Vercel Serverless Functions
// Ce fichier exporte l'application Express pour qu'elle fonctionne comme une fonction serverless sur Vercel

import app from '../src/index.js';

// Export de l'application pour Vercel
// Vercel attend une fonction handler qui reçoit (req, res)
export default function handler(req, res) {
  return app(req, res);
}


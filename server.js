const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'sentieri';

const app = express();
app.use(express.json({ limit: '15mb' })); // le foto arrivano come base64, serve un limite generoso
app.use(express.static(path.join(__dirname, 'public')));

let db;

function serialize(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function asObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (e) {
    return null;
  }
}

function calculateTrailLengthKm(latlngs) {
  if (!Array.isArray(latlngs) || latlngs.length < 2) return 0;

  const earthRadiusKm = 6371.0088;
  let lengthKm = 0;

  for (let index = 1; index < latlngs.length; index += 1) {
    const previous = latlngs[index - 1];
    const current = latlngs[index];
    if (!Array.isArray(previous) || !Array.isArray(current) || previous.length < 2 || current.length < 2) continue;

    const previousLat = Number(previous[0]) * Math.PI / 180;
    const currentLat = Number(current[0]) * Math.PI / 180;
    const deltaLat = currentLat - previousLat;
    const deltaLng = (Number(current[1]) - Number(previous[1])) * Math.PI / 180;
    const haversine = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(previousLat) * Math.cos(currentLat) * Math.sin(deltaLng / 2) ** 2;

    if (Number.isFinite(haversine)) {
      lengthKm += 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }
  }

  return Math.round(lengthKm * 100) / 100;
}

/* ---------------- TRAILS ---------------- */

app.get('/api/trails', async (req, res) => {
  try {
    const docs = await db.collection('trails').find().toArray();
    res.json(docs.map(doc => serialize({ ...doc, lengthKm: calculateTrailLengthKm(doc.latlngs) })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nel leggere i sentieri.' });
  }
});

app.post('/api/trails', async (req, res) => {
  try {
    const { name, date, desc, color, latlngs } = req.body;
    if (!name || !Array.isArray(latlngs) || latlngs.length < 2) {
      return res.status(400).json({ error: 'Dati sentiero incompleti.' });
    }
    const doc = { name, date, desc: desc || '', color: color || '#A8542E', latlngs, createdAt: new Date() };
    const result = await db.collection('trails').insertOne(doc);
    res.json(serialize({ _id: result.insertedId, ...doc, lengthKm: calculateTrailLengthKm(latlngs) }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nel salvare il sentiero.' });
  }
});

app.put('/api/trails/:id', async (req, res) => {
  try {
    const oid = asObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'ID non valido.' });
    const { name, date, desc, color } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (date !== undefined) update.date = date;
    if (desc !== undefined) update.desc = desc;
    if (color !== undefined) update.color = color;
    await db.collection('trails').updateOne({ _id: oid }, { $set: update });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nell\'aggiornare il sentiero.' });
  }
});

app.delete('/api/trails/:id', async (req, res) => {
  try {
    const oid = asObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'ID non valido.' });
    await db.collection('trails').deleteOne({ _id: oid });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nell\'eliminare il sentiero.' });
  }
});

/* ---------------- POINTS ---------------- */

app.get('/api/points', async (req, res) => {
  try {
    const docs = await db.collection('points').find().toArray();
    res.json(docs.map(serialize));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nel leggere i punti.' });
  }
});

app.post('/api/points', async (req, res) => {
  try {
    const { name, date, desc, photo, lat, lng } = req.body;
    if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Dati punto incompleti.' });
    }
    const doc = { name, date, desc: desc || '', photo: photo || null, lat, lng, createdAt: new Date() };
    const result = await db.collection('points').insertOne(doc);
    res.json(serialize({ _id: result.insertedId, ...doc }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nel salvare il punto.' });
  }
});

app.put('/api/points/:id', async (req, res) => {
  try {
    const oid = asObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'ID non valido.' });
    const { name, date, desc, photo } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (date !== undefined) update.date = date;
    if (desc !== undefined) update.desc = desc;
    if (photo !== undefined) update.photo = photo;
    await db.collection('points').updateOne({ _id: oid }, { $set: update });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nell\'aggiornare il punto.' });
  }
});

app.delete('/api/points/:id', async (req, res) => {
  try {
    const oid = asObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'ID non valido.' });
    await db.collection('points').deleteOne({ _id: oid });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nell\'eliminare il punto.' });
  }
});

/* ---------------- START ---------------- */

async function start() {
  const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connesso a MongoDB su ' + MONGO_URL + ' (database "' + DB_NAME + '")');
  } catch (e) {
    console.error('Impossibile connettersi a MongoDB su ' + MONGO_URL + '.');
    console.error('Assicurati che MongoDB sia in esecuzione in locale sulla porta 27017.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('Server avviato su http://localhost:' + PORT);
  });
}

start();

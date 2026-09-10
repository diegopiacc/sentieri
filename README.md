# Sentieri

Webapp locale per tracciare sentieri (linee spezzate) e punti salienti con data e foto, su mappa OpenStreetMap. I dati sono salvati in un MongoDB in esecuzione sul tuo computer.

## Requisiti

- Node.js (già presente se hai eseguito questo progetto)
- MongoDB in esecuzione in locale sulla porta standard 27017
  (se non l'hai già, su Mac: `brew install mongodb-community && brew services start mongodb-community`;
  su Linux, installa `mongodb-org` e avvia il servizio `mongod`; su Windows, installa MongoDB Community Server, che si avvia come servizio.)

## Avvio

```
npm install
npm start
```

Poi apri il browser su:

```
http://localhost:3000
```

## Come si usa

- **Nuovo sentiero**: clicca sul pulsante, poi clicca sulla mappa punto dopo punto per tracciare la spezzata. Premi "Fine" per dare un nome, una data, delle note e un colore.
- **Nuovo punto**: clicca sul pulsante, poi clicca sulla mappa dove vuoi posizionarlo. Si apre un modulo per nome, data, note e una foto (viene ridimensionata e compressa automaticamente prima di essere salvata).
- L'elenco a sinistra mostra tutti i sentieri e i punti salvati: cliccandoli la mappa si centra su di loro. Ogni elemento può essere modificato o eliminato dal popup sulla mappa.
- La barra di ricerca in alto usa OpenStreetMap (Nominatim) per spostarsi rapidamente su un luogo.

## Dati

I dati vengono salvati in un database MongoDB chiamato `sentieri`, in due collezioni: `trails` e `points`. Puoi cambiare l'indirizzo del database o il suo nome impostando le variabili d'ambiente `MONGO_URL` e `DB_NAME` prima di avviare il server, ad esempio:

```
MONGO_URL=mongodb://localhost:27017 DB_NAME=sentieri npm start
```

Le foto sono salvate come immagini compresse direttamente nei documenti Mongo (non su disco), quindi un backup del database porta con sé anche tutte le foto.

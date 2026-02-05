# Luxury Booking - TODO List

## Database & Schema
- [x] Creare tabella properties (ville) con campi: nome, descrizione, prezzo, servizi, posizione, status approvazione
- [x] Creare tabella property_images per gallerie fotografiche multiple
- [x] Creare tabella property_amenities per servizi (piscina, vista mare, vista montagna, etc.)
- [x] Creare tabella bookings per prenotazioni con date check-in/check-out
- [x] Creare tabella reviews per recensioni con stelle e commenti
- [x] Creare tabella messages per messaggistica tra ospiti e proprietari
- [x] Creare tabella availability_calendar per gestione disponibilità ville
- [x] Aggiornare tabella users con ruoli (guest, host, admin)

## Autenticazione & Ruoli
- [x] Configurare Manus OAuth con Google e altri provider social
- [x] Implementare sistema ruoli utente (guest, host, admin)
- [x] Creare middleware per protezione route basate su ruoli
- [ ] Implementare dashboard utente base con profilo

## Interfaccia Proprietari (Host)
- [x] Creare form inserimento nuova villa con validazione
- [x] Implementare upload multiplo immagini con S3
- [x] Creare interfaccia gestione servizi/amenities villa
- [ ] Implementare calendario disponibilità per proprietari
- [x] Dashboard proprietario per visualizzare prenotazioni ricevute
- [ ] Sistema notifiche per nuove prenotazioni

## Dashboard Amministratore
- [x] Creare dashboard admin per visualizzare ville in attesa approvazione
- [x] Implementare funzione approvazione/rifiuto ville
- [x] Sistema notifiche per proprietari su approvazione/rifiuto
- [ ] Pannello statistiche generali piattaforma

## Sistema Ricerca & Prenotazioni
- [x] Implementare barra ricerca con filtri (prezzo, data, servizi, posizione)
- [x] Creare pagina risultati ricerca con griglia ville
- [ ] Implementare filtri avanzati (piscina, vista mare/montagna, numero ospiti)
- [x] Creare pagina dettaglio villa con galleria fotografica
- [ ] Implementare calendario prenotazione con selezione date
- [ ] Sistema verifica disponibilità in tempo reale
- [ ] Flow prenotazione completo con riepilogo

## Integrazione Pagamenti Stripe
- [ ] Configurare Stripe con webdev_add_feature
- [ ] Implementare checkout Stripe per prenotazioni
- [ ] Gestire pagamenti e conferme prenotazione
- [ ] Sistema rimborsi per cancellazioni
- [ ] Dashboard pagamenti per proprietari

## Sistema Recensioni
- [ ] Implementare form recensione con stelle (1-5) e commento
- [ ] Visualizzazione recensioni su pagina villa
- [ ] Calcolo rating medio villa
- [ ] Sistema verifica recensione solo dopo soggiorno completato

## Messaggistica Real-time
- [ ] Implementare sistema messaggi tra ospite e proprietario
- [ ] Interfaccia chat con storico messaggi
- [ ] Notifiche nuovi messaggi in tempo reale
- [ ] Badge contatore messaggi non letti

## Design UI/UX Luxury
- [x] Definire palette colori elegante e lussuosa
- [x] Implementare tipografia sofisticata con Google Fonts
- [x] Creare homepage con hero section impattante
- [x] Implementare gallerie fotografiche professionali con lightbox
- [x] Design responsive mobile-first
- [x] Animazioni e transizioni fluide
- [ ] Ottimizzazione immagini e performance

## Testing & Deploy
- [ ] Scrivere test Vitest per funzionalità critiche
- [ ] Test end-to-end flow prenotazione completo
- [ ] Test sistema pagamenti in modalità test Stripe
- [ ] Ottimizzazioni performance e SEO
- [ ] Checkpoint finale per deploy

## Sistema Messaggistica Istantanea
- [x] Installare e configurare Socket.io per messaggi in tempo reale
- [x] Creare procedure tRPC per gestione conversazioni e messaggi
- [x] Implementare pagina chat con lista conversazioni
- [x] Creare interfaccia messaggi con invio in tempo reale
- [x] Aggiungere notifiche per nuovi messaggi
- [x] Implementare indicatore "sta scrivendo..."
- [ ] Test messaggistica tra ospiti e proprietari

## Vista Mappa Integrata
- [x] Aggiungere coordinate geografiche alle proprietà nel database
- [x] Implementare vista split-screen lista + mappa stile Booking.com
- [x] Integrare Google Maps con marker per ogni villa
- [x] Sincronizzare hover lista con highlight marker sulla mappa
- [x] Implementare click marker per aprire dettaglio villa
- [ ] Aggiungere clustering marker per zoom out

## Sistema Messaggistica Istantanea
- [x] Installare e configurare Socket.io per messaggi in tempo reale
- [x] Creare procedure tRPC per gestione conversazioni e messaggi
- [x] Implementare pagina chat con lista conversazioni
- [x] Creare interfaccia messaggi con invio in tempo reale
- [x] Aggiungere notifiche per nuovi messaggi
- [x] Implementare indicatore "sta scrivendo..."
- [ ] Test messaggistica tra ospiti e proprietari

## Sistema Verifica Utente (2FA)
- [x] Aggiungere campi phone e isVerified al database utenti
- [x] Implementare generazione e invio codice verifica SMS/email
- [x] Creare pagina verifica con input codice
- [x] Implementare validazione codice e aggiornamento stato verifica
- [x] Badge "Verificato" nel profilo utente

## Dashboard Utente Completa
- [x] Creare layout dashboard con sidebar navigazione
- [x] Sezione "Le mie prenotazioni" con tab (attive, passate, cancellate)
- [x] Sezione "Le mie recensioni" con storico recensioni lasciate
- [x] Sezione "Preferiti/Wishlist" per salvare ville preferite
- [x] Sezione "Impostazioni profilo" con modifica dati personali
- [x] Sezione "Dati di pagamento" per carte salvate
- [x] Sezione "Documenti identità" per upload documenti
- [x] Sezione "Notifiche e preferenze" per gestione comunicazioni
- [x] Statistiche e overview nella homepage dashboard


## Bug da Correggere
- [x] Fix errore 404 su route /profile - creare pagina profilo utente
- [x] Collegare link "nino lai" nella navigazione alla pagina profilo corretta


## Sistema Pagamento Bonifico Bancario
- [x] Aggiungere campi database per dati bancari proprietari (IBAN, nome banca, intestatario)
- [x] Creare procedure tRPC per gestione dati bancari (add, update, get)
- [x] Implementare validazione IBAN europea
- [x] Creare sezione dashboard host per inserimento dati bancari
- [x] Mascheramento parziale IBAN per privacy nella visualizzazione
- [x] Test per validazione e gestione dati bancari


## Funzionalità Mappa Avanzate
- [x] Implementare autocomplete città con Google Places Autocomplete API
- [x] Aggiungere suggerimenti in tempo reale mentre l'utente scrive
- [x] Implementare geolocalizzazione utente con Browser Geolocation API
- [x] Aggiungere marker blu pulsante per posizione utente sulla mappa
- [x] Centrare mappa automaticamente su posizione utente
- [x] Implementare calcolo distanza tra posizione utente e ville
- [x] Ordinare risultati ville per vicinanza
- [ ] Aggiungere filtro ricerca per raggio distanza (es. entro 50km)


## Bug Marker Blu Utente
- [x] Correggere marker blu pulsante non visibile sulla mappa
- [x] Verificare animazione CSS animate-ping funzioni correttamente
- [x] Assicurare z-index alto per marker utente sopra altri marker
- [x] Testare geolocalizzazione browser e visualizzazione marker


## Geolocalizzazione Automatica Mappa
- [x] Richiedere automaticamente posizione utente all'apertura pagina mappa
- [x] Mostrare messaggio informativo prima della richiesta permesso
- [x] Gestire caso permesso negato con messaggio chiaro
- [x] Mantenere pulsante manuale come alternativa


## Bug Google Maps Caricamento Multiplo
- [x] Correggere errore "Google Maps JavaScript API included multiple times"
- [x] Verificare componente Map non venga montato/smontato ripetutamente
- [x] Assicurare script Google Maps caricato una sola volta
- [x] Testare navigazione tra pagine senza errori console


## Indirizzo Completo su Mappa
- [ ] Aggiungere campo address (via/indirizzo) al database properties
- [ ] Modificare marker mappa per mostrare indirizzo nei tooltip
- [ ] Aggiungere indirizzo completo nelle info window marker
- [ ] Testare visualizzazione indirizzo su hover e click marker

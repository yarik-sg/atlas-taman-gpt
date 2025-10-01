# Atlas Taman Backend

## Variables d'environnement HTTP par marchand

Chaque connecteur HTTP peut être personnalisé via des variables d'environnement préfixées par l'identifiant du marchand (ex. `ELECTROPLANET_`, `JUMIA_`, etc.).

| Variable | Description |
| --- | --- |
| `*_SEARCH_URL` | URL de recherche par défaut. |
| `*_QUERY_PARAM` | Paramètre de requête utilisé pour le terme recherché. |
| `*_HEADERS` | En-têtes HTTP additionnels/alternatifs (JSON ou liste clé=valeur). |
| `*_STATIC_PARAMS` | Paramètres de requête supplémentaires (JSON ou liste clé=valeur). |
| `*_DELAY_MS` | Délai artificiel avant la requête (millisecondes). |
| `*_TIMEOUT_MS` | Délai maximum pour la requête (millisecondes). |
| `*_CURRENCY` | Devise par défaut retournée par le marchand. |
| `*_PROXY_URL` | URL d'un proxy HTTP(s) facultatif utilisé pour les requêtes vers le marchand. |

> ℹ️ Exemple : pour configurer un proxy sur Jumia, définissez `JUMIA_PROXY_URL="http://mon-proxy.local:3128"` dans le fichier `.env` du backend.

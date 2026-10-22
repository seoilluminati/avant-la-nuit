# Avant la nuit

**Serai-je rentré avant la nuit ?** Déposez une trace GPX de randonnée ou de vélo,
choisissez une heure de départ, et obtenez :

- 🟢🟠🔴 **la trace colorée selon la lumière** : de jour, au crépuscule ou de nuit au moment où vous y passez ;
- ⛔ **le point de non-retour** : le dernier endroit d'où un demi-tour vous ramène au départ avant le coucher du soleil ;
- ⏰ **l'heure de départ au plus tard** pour finir de jour ;
- 💧 en option, **les points d'eau potable** à moins de 200 m de la trace (OpenStreetMap).

**→ Essayer : https://seoilluminati.github.io/avant-la-nuit/** (sans compte, fonctionne hors ligne, votre GPX ne quitte jamais votre appareil)

## Pourquoi

Se faire surprendre par la nuit est l'une des causes les plus fréquentes d'appel aux
secours en montagne. Ça arrive surtout à des gens en forme et bien équipés, partis
simplement trop tard ou qui n'ont pas fait demi-tour à temps. Les planificateurs
d'itinéraires donnent la distance et la durée, mais aucun ne répond à la question qui
compte à 15 h un après-midi de novembre : *si je continue, est-ce que je rentre avant
la nuit, et où est le dernier endroit sûr pour faire demi-tour ?*

## Calcul

- vitesse à pied : [fonction de Tobler](https://fr.wikipedia.org/wiki/Fonction_de_randonn%C3%A9e_de_Tobler), un peu prudente par défaut ;
- vitesse à vélo : modèle à puissance constante (roulement, pente, air), plafonné en descente ;
- pauses incluses (minutes par heure de déplacement) ;
- soleil : formules de l'Astronomical Almanac, précision d'environ une minute ;
- coucher du soleil sur **horizon plat, volontairement** : en vallée, les crêtes cachent le soleil plus tôt ;
- point de non-retour : dernier point où *temps pour y arriver + temps pour revenir* ≤ heure limite, le retour étant recalculé avec les pentes inversées.

> ⚠️ Une estimation, pas une garantie. Prenez toujours une frontale, gardez de la marge,
> renseignez-vous sur la météo et le terrain.

Bibliothèque JavaScript, ligne de commande et détails techniques : voir le [README en anglais](README.md).

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md). Les signalements avec un fichier GPX et le temps
réel constaté sont les contributions les plus utiles. Les traductions de l'interface sont bienvenues.

## Licence

[MIT](LICENSE). Données cartographiques © [contributeurs OpenStreetMap](https://www.openstreetmap.org/copyright).

# Remplacer le README initial par le projet complet

Tu as créé le repo GitHub en cochant "Add a README". Du coup GitHub a un premier commit avec juste un README. Pour le remplacer par tout ton projet (43 fichiers) :

## En ligne de commande (dans ce dossier)

Ouvre un terminal dans le dossier du projet, puis exécute :

```bash
git push --force origin main
```

Cela remplace l’historique sur GitHub par ton dépôt local : le README seul disparaît et tout le site Julie Rosali est poussé.

**Important :** Utilise ce `--force` seulement sur un repo neuf ou si tu es sûre de vouloir écraser ce qu’il y a sur GitHub. Ici c’est le cas (tu veux enlever le README initial).

Si Git demande une authentification, connecte-toi avec le compte **Julierosali**.

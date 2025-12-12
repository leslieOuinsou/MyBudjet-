import React from 'react';
import * as MdIcons from 'react-icons/md';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io5';

/**
 * Composant pour afficher dynamiquement des icônes professionnelles
 * @param {string} iconName - Nom de l'icône (ex: 'MdRestaurant', 'FaWallet')
 * @param {string} className - Classes CSS additionnelles
 * @param {string} color - Couleur de l'icône
 * @param {number} size - Taille de l'icône (par défaut 24)
 */
const CategoryIcon = ({ iconName, className = '', color, size = 24, style = {} }) => {
  // Si pas d'icône spécifiée, afficher une icône par défaut
  if (!iconName) {
    const DefaultIcon = MdIcons.MdCircle;
    return <DefaultIcon size={size} className={className} style={{ color, ...style }} />;
  }

  // Déterminer quelle bibliothèque d'icônes utiliser
  let IconComponent = null;
  
  if (iconName.startsWith('Md')) {
    IconComponent = MdIcons[iconName];
  } else if (iconName.startsWith('Fa')) {
    IconComponent = FaIcons[iconName];
  } else if (iconName.startsWith('Io')) {
    IconComponent = IoIcons[iconName];
  }

  // Si l'icône n'est pas trouvée, afficher une icône par défaut
  if (!IconComponent) {
    const DefaultIcon = MdIcons.MdCircle;
    return <DefaultIcon size={size} className={className} style={{ color, ...style }} />;
  }

  return <IconComponent size={size} className={className} style={{ color, ...style }} />;
};

export default CategoryIcon;


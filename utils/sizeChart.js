function calculateShirtSize(chestCircumference) {
    const chest = parseFloat(chestCircumference);
    if (chest < 34) return 'XS';
    else if (chest >= 34 && chest <= 36) return 'S';
    else if (chest >= 37 && chest <= 40) return 'M';
    else if (chest >= 41 && chest <= 44) return 'L';
    else if (chest >= 45 && chest <= 48) return 'XL';
    else return 'XXL';
  }
  
  function calculatePantSize(waistCircumference) {
    const waist = parseFloat(waistCircumference);
    if (waist < 28) return 'XS';
    else if (waist >= 28 && waist <= 30) return 'S';
    else if (waist >= 31 && waist <= 34) return 'M';
    else if (waist >= 35 && waist <= 38) return 'L';
    else if (waist >= 39 && waist <= 42) return 'XL';
    else return 'XXL';
  }

module.exports ={  calculateShirtSize ,  calculatePantSize }
/**
 * Calcula o CRC16 para o payload Pix usando a polinomial 0x1021 e valor inicial 0xFFFF (padrão CCITT).
 * @param {string} str - O payload base do Pix.
 * @returns {string} O checksum hexadecimal de 4 dígitos em maiúsculas.
 */
function crc16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Remove acentos e caracteres especiais incompatíveis com a especificação EMV do Pix.
 * @param {string} text - O texto a ser sanitizado.
 * @returns {string} O texto limpo sem acentuação.
 */
function sanitizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, ''); // Mantém apenas letras, números e espaços
}

/**
 * Gera a string Pix Copia e Cola (BR Code) estática.
 * @param {object} params - Parâmetros para geração do Pix.
 * @param {string} params.key - A chave Pix do recebedor (E-mail, CPF/CNPJ, Telefone ou Chave Aleatória).
 * @param {string} params.merchantName - Nome do estabelecimento recebedor.
 * @param {string} params.merchantCity - Cidade do estabelecimento.
 * @param {number} params.amount - Valor total do pedido.
 * @param {string} [params.txid] - ID opcional da transação (máx 25 chars, sem espaços).
 * @returns {string} O payload completo com CRC16.
 */
export function generatePixPayload({ key, merchantName, merchantCity, amount, txid = '***' }) {
  if (!key) return '';

  const formatField = (id, value) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  // 1. Merchant Account Information (ID 26)
  const gui = formatField('00', 'br.gov.bcb.pix');
  // Remove espaços ou parênteses se a chave for celular
  const cleanKey = key.trim();
  const keyField = formatField('01', cleanKey);
  const merchantAccountInfo = formatField('26', gui + keyField);

  // 2. Merchant Category Code (ID 52) - '0000' é o padrão genérico
  const merchantCategoryCode = formatField('52', '0000');

  // 3. Transaction Currency (ID 53) - '986' representa o Real Brasileiro (BRL)
  const transactionCurrency = formatField('53', '986');

  // 4. Transaction Amount (ID 54) - Duas casas decimais
  const amountStr = parseFloat(amount || 0).toFixed(2);
  const transactionAmount = formatField('54', amountStr);

  // 5. Country Code (ID 58) - 'BR'
  const countryCode = formatField('58', 'BR');

  // 6. Merchant Name (ID 59) - Máx 25 caracteres, limpo de acentos
  const cleanName = sanitizeText(merchantName).substring(0, 25).trim();
  const merchantNameField = formatField('59', cleanName || 'LOJA');

  // 7. Merchant City (ID 60) - Máx 15 caracteres, limpo de acentos
  const cleanCity = sanitizeText(merchantCity).substring(0, 15).trim();
  const merchantCityField = formatField('60', cleanCity || 'CIDADE');

  // 8. Additional Data Field Template (ID 62) - Contém o TXID
  const cleanTxid = txid.replace(/\s+/g, '').substring(0, 25) || '***';
  const txidField = formatField('05', cleanTxid);
  const additionalData = formatField('62', txidField);

  // Concatenação de todos os campos obrigatórios (incluindo o ID 63 que indica o início do CRC16)
  const payloadBase = [
    formatField('00', '01'), // Payload Format Indicator
    formatField('01', '11'), // Point of Initiation Method (11 = estático)
    merchantAccountInfo,
    merchantCategoryCode,
    transactionCurrency,
    transactionAmount,
    countryCode,
    merchantNameField,
    merchantCityField,
    additionalData,
    '6304' // Indicação de campo CRC16 com tamanho 04
  ].join('');

  const checksum = crc16(payloadBase);
  return payloadBase + checksum;
}

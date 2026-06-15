/**
 * Utilitário para otimizar URLs de imagens do Cloudinary
 * Injeta parâmetros de transformação (q_auto, f_auto, w_, c_fill) 
 * para reduzir drasticamente o tamanho do download no frontend.
 */
export const optimizeImage = (url, width = 600, height = null) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url;
  }

  // Se já tiver otimizações aplicadas manualmente, não altera para evitar quebrar a URL
  if (url.includes('q_auto') || url.includes('w_') || url.includes('e_bgremoval')) {
    return url;
  }

  const heightParam = height ? `,h_${height}` : '';
  const transformString = `/upload/q_auto,f_auto,w_${width}${heightParam},c_fill/`;

  return url.replace('/upload/', transformString);
};

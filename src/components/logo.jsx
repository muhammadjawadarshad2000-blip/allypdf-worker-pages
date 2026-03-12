export const AllyPdfLogo = ({ width = 500, height = 150, fill = "#1b52cc", strokeWidth = 0 }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 750 200" xmlns="http://www.w3.org/2000/svg">
      <title>Allypdf Logo</title>

      <g fill={fill}>
        <polygon transform="translate(2,-10)" points="0,188 140,169 18,165" />
        <polygon transform="translate(28,-10)" points="0,150 160,170 19,125" />
        <polygon transform="translate(56,-10)" points="0,110 163,178 21,80" />
        <polygon transform="translate(88,-10)" points="0,65 151,188 26,25" />
      </g>

      <text x="260" y="160" strokeWidth={strokeWidth} stroke={fill} fontFamily="Arial, Helvetica, sans-serif" fontSize="160" fontWeight="500" fill={fill}>
        Allypdf
      </text>
    </svg>
  );
};
/**
 * Iconos NEXUS: trazos de 1.75 px, una sola tinta (currentColor) y viewBox 24.
 * Se inyectan como SVG inline; por eso se marcan como decorativos y el nombre
 * accesible lo aporta siempre el control que los contiene.
 */
const trazo = (cuerpo: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${cuerpo}</svg>`;

export const alienIcon = trazo(
  '<path d="M12 3c4.4 0 7 3.4 7 7.5 0 4.7-3 8.5-7 8.5s-7-3.8-7-8.5C5 6.4 7.6 3 12 3Z"/><path d="M9 11h.01M15 11h.01M9.5 15c1.6 1.2 3.4 1.2 5 0"/>'
);

export const geekicon = trazo(
  '<circle cx="8.5" cy="11" r="3"/><circle cx="15.5" cy="11" r="3"/><path d="M11.5 11h1M5.5 10 4 5.5M18.5 10 20 5.5M8 18c2.6 1.4 5.4 1.4 8 0"/>'
);

export const pirateIcon = trazo(
  '<path d="M5 11a7 7 0 0 1 14 0v4l-2 2v3H7v-3l-2-2Z"/><path d="M4 8c3-3 13-3 16 0M9 12h.01M15 12h.01M10 20v-3M14 20v-3"/>'
);

export const editorIcon = trazo(
  '<path d="M4 20h16M5 15.5 15.5 5l3.5 3.5L8.5 19H5Z"/><path d="m13.5 7 3.5 3.5"/>'
);

export const detalleIcon = trazo(
  '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/>'
);

export const computerIcon = trazo(
  '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'
);

export const printerIcon = trazo(
  '<path d="M7 8V3h10v5"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7Z"/>'
);

export const mobileIcon = trazo(
  '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M11 18.5h2M9 12l2.5-2.5 2 2L17 8M14 8h3v3"/>'
);

export const upsIcon = trazo(
  '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M11 9l-3 4h3l-1 3 4-5h-3Z"/>'
);

export const ticketIcon = trazo(
  '<path d="M3 8a2 2 0 0 0 0 4v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5a2 2 0 0 1 0-4V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z"/><path d="M14 4v3m0 3v3m0 3v4"/>'
);

export const ticketsIcon = trazo(
  '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 6V4h14v12h-2M10 10h4M10 14h4"/>'
);

export const equiposIcon = trazo(
  '<rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h5M12 17.5h5"/>'
);

export const logoTecpan = ``;

export const work = trazo(
  '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>'
);

export const computer = trazo(
  '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4M6 8h5"/>'
);

export const redes = trazo(
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
);

export const software = trazo(
  '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>'
);

export const diseño = trazo(
  '<path d="M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 0-5H13a2 2 0 0 1 0-4h3a5 5 0 0 0 5-5c0-2.2-4-4-9-4Z"/><path d="M7.5 9h.01M10 6.5h.01M15 7.5h.01"/>'
);

export const critical = trazo(
  '<path d="M12 4 2.5 20h19Z"/><path d="M12 10v5M12 17.5h.01"/>'
);

export const ok = trazo(
  '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/>'
);

export const clockMove = trazo(
  '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2M4 4l2 2M20 4l-2 2"/>'
);

export const clock = trazo(
  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
);

export const filterIcons = trazo(
  '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>'
);

export const campanaIcons = trazo(
  '<path d="M18 16H6l2-3V9a4 4 0 0 1 8 0v4Z"/><path d="M10 19a2 2 0 0 0 4 0"/>'
);

export const reportIcon = trazo(
  '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
);

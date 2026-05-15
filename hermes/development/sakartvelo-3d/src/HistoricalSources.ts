export type SourceTier = 1 | 2 | 3 | 4;

export type SourceKind =
  | 'institutional'
  | 'official'
  | 'academic'
  | 'ancient-source'
  | 'medieval-source'
  | 'reference'
  | 'discovery';

export interface HistoricalSource {
  id: string;
  title: string;
  kind: SourceKind;
  tier: SourceTier;
  note: string;
  url?: string;
}

/**
 * Stable IDs for historical and cultural claims used by briefings.
 *
 * Tier policy:
 * 1. Official, institutional, or primary references.
 * 2. Academic scholarship and serious historical references.
 * 3. Ancient or medieval testimony that must be presented with context.
 * 4. Discovery-only sources that can suggest leads but should not finalize claims.
 */
export const HISTORICAL_SOURCES: Record<string, HistoricalSource> = {
  UNESCO_VANI: {
    id: 'UNESCO_VANI',
    title: 'Vani Archaeological Site — UNESCO Tentative List',
    kind: 'institutional',
    tier: 1,
    url: 'https://whc.unesco.org/en/tentativelists/5235/',
    note: 'Use for Vani, Colchian archaeology, Hellenistic-period material culture, and western Georgian archaeological context.',
  },
  UNESCO_GEORGIAN_WRITING: {
    id: 'UNESCO_GEORGIAN_WRITING',
    title: 'Living culture of three writing systems of the Georgian alphabet — UNESCO ICH',
    kind: 'institutional',
    tier: 1,
    url: 'https://ich.unesco.org/en/RL/living-culture-of-three-writing-systems-of-the-georgian-alphabet-01205',
    note: 'Use for Asomtavruli, Nuskhuri, Mkhedruli, and UNESCO-recognized living writing culture. Avoid unsupported global ranking claims.',
  },
  UNESCO_QVEVRI: {
    id: 'UNESCO_QVEVRI',
    title: 'Ancient Georgian traditional Qvevri wine-making method — UNESCO ICH',
    kind: 'institutional',
    tier: 1,
    url: 'https://ich.unesco.org/en/RL/ancient-georgian-traditional-qvevri-wine-making-method-00870',
    note: 'Use for qvevri winemaking and long-lived Georgian wine culture.',
  },
  GEORGIAN_ENCYCLOPEDIA_ASPINDZA: {
    id: 'GEORGIAN_ENCYCLOPEDIA_ASPINDZA',
    title: 'Battle of Aspindza — Georgian Encyclopedia',
    kind: 'reference',
    tier: 1,
    url: 'https://georgianencyclopedia.ge/en/form_eng/345',
    note: 'Use for Aspindza as a 1770 battle connected with Erekle II. Do not use the incorrect 1510 date.',
  },
  GEORGIAN_ENCYCLOPEDIA_DIDGORI: {
    id: 'GEORGIAN_ENCYCLOPEDIA_DIDGORI',
    title: 'Battle of Didgori — Georgian Encyclopedia',
    kind: 'reference',
    tier: 1,
    url: 'https://georgianencyclopedia.ge/en/form_eng/692',
    note: 'Use for Didgori as David IV’s 1121 victory. Keep it in the Golden Age era, not the pre-1089 invasion era.',
  },
  BRITANNICA_COLCHIS: {
    id: 'BRITANNICA_COLCHIS',
    title: 'Colchis — Encyclopaedia Britannica',
    kind: 'reference',
    tier: 2,
    url: 'https://www.britannica.com/place/Colchis',
    note: 'Use as a compact reference for Colchis as the ancient Black Sea region associated with Greek traditions and Georgian antiquity.',
  },
  BRITANNICA_MEDEA: {
    id: 'BRITANNICA_MEDEA',
    title: 'Medea — Encyclopaedia Britannica',
    kind: 'reference',
    tier: 2,
    url: 'https://www.britannica.com/topic/Medea-Greek-mythology',
    note: 'Use for Medea as a Greek mythological figure tied to Colchis. Do not present her as a verified historical commander.',
  },
  BRITANNICA_GEORGIA_FLAG: {
    id: 'BRITANNICA_GEORGIA_FLAG',
    title: 'Flag of Georgia — Encyclopaedia Britannica',
    kind: 'reference',
    tier: 2,
    url: 'https://www.britannica.com/topic/flag-of-Georgia-national-flag',
    note: 'Use to verify the modern five-cross flag. The Borjgali should not be described as part of the modern national flag.',
  },
  EU_GEORGIA_ACCESSION_2024: {
    id: 'EU_GEORGIA_ACCESSION_2024',
    title: 'European Council conclusions on Georgia’s EU path, 2024',
    kind: 'official',
    tier: 1,
    url: 'https://www.consilium.europa.eu/en/press/press-releases/2024/06/27/european-council-conclusions-on-ukraine-enlargement-and-reforms/',
    note: 'Use careful wording: Georgia received candidate status in 2023, while EU institutions later described the accession process as de facto halted. Do not say candidacy was revoked.',
  },
  KARTLIS_TSKHOVREBA: {
    id: 'KARTLIS_TSKHOVREBA',
    title: 'Kartlis Tskhovreba / The Georgian Chronicles',
    kind: 'medieval-source',
    tier: 3,
    note: 'Use for medieval Georgian narrative tradition. Label legendary, dynastic, and numerical claims carefully.',
  },
  HERODOTUS_HISTORIES: {
    id: 'HERODOTUS_HISTORIES',
    title: 'Herodotus, Histories',
    kind: 'ancient-source',
    tier: 3,
    note: 'Use for ancient testimony about Colchis with context. Ancient ethnographic claims should not be repeated as modern fact.',
  },
};

export const SOURCE_IDS = Object.freeze(Object.keys(HISTORICAL_SOURCES));

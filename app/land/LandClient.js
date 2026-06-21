'use client';
import { useState } from 'react';
import styles from './land.module.css';

const M2_PER_DAM    = 1.9866;
const M2_PER_PAISA  = 4 * M2_PER_DAM;
const M2_PER_ANA    = 4 * M2_PER_PAISA;
const M2_PER_ROPANI = 16 * M2_PER_ANA;
const M2_PER_DHUR   = 16.93;
const M2_PER_KATTHA = 20 * M2_PER_DHUR;
const M2_PER_BIGHA  = 20 * M2_PER_KATTHA;
const SQFT_PER_M2   = 10.7639104;
const ACRE_PER_M2   = 1 / 4046.8564224;

function pf(v) {
  const n = parseFloat(v);
  return isNaN(n) || n < 0 ? 0 : n;
}

function fmt(n, d = 2) {
  if (n === 0) return '0';
  return parseFloat(n.toFixed(d)).toLocaleString(undefined, { maximumFractionDigits: d });
}

const HILL_FIELDS = [
  { key: 'ropani', deva: 'रोपनी', label: 'Ropani', step: '1'   },
  { key: 'ana',    deva: 'आना',   label: 'Ana',    step: '1'   },
  { key: 'paisa',  deva: 'पैसा',  label: 'Paisa',  step: '1'   },
  { key: 'dam',    deva: 'दाम',   label: 'Dam',    step: '0.1' },
];

const TERAI_FIELDS = [
  { key: 'bigha',  deva: 'बिघा',  label: 'Bigha',  step: '1'    },
  { key: 'kattha', deva: 'कट्ठा', label: 'Kattha', step: '1'    },
  { key: 'dhur',   deva: 'धुर',   label: 'Dhur',   step: '0.01' },
];

const EXAMPLES = [
  { side: 'hill',  label: '१ रोपनी',      sub: '1 Ropani',         hill:  { ropani: '1', ana: '0', paisa: '0', dam: '0' } },
  { side: 'hill',  label: '४ आना',        sub: '4 Ana (¼ ropani)', hill:  { ropani: '0', ana: '4', paisa: '0', dam: '0' } },
  { side: 'hill',  label: '५ रो. ८ आना', sub: '5 Ropani 8 Ana',   hill:  { ropani: '5', ana: '8', paisa: '0', dam: '0' } },
  { side: 'terai', label: '१ बिघा',       sub: '1 Bigha',          terai: { bigha: '1', kattha: '0', dhur: '0' } },
  { side: 'terai', label: '५ कट्ठा',      sub: '5 Kattha',         terai: { bigha: '0', kattha: '5', dhur: '0' } },
  { side: 'terai', label: '१० धुर',       sub: '10 Dhur',          terai: { bigha: '0', kattha: '0', dhur: '10' } },
];

export default function LandClient() {
  const [direction, setDirection] = useState('hillToTerai');
  const [hill,  setHill]  = useState({ ropani: '', ana: '', paisa: '', dam: '' });
  const [terai, setTerai] = useState({ bigha: '', kattha: '', dhur: '' });

  const hillM2  = pf(hill.ropani)  * M2_PER_ROPANI + pf(hill.ana)    * M2_PER_ANA
                + pf(hill.paisa)   * M2_PER_PAISA  + pf(hill.dam)    * M2_PER_DAM;
  const teraiM2 = pf(terai.bigha)  * M2_PER_BIGHA  + pf(terai.kattha)* M2_PER_KATTHA
                + pf(terai.dhur)   * M2_PER_DHUR;

  const m2 = direction === 'hillToTerai' ? hillM2 : teraiM2;

  // Compute outputs
  let outTerai = { bigha: 0, kattha: 0, dhur: 0 };
  let outHill  = { ropani: 0, ana: 0, paisa: 0, dam: 0 };

  if (direction === 'hillToTerai') {
    let rem = m2;
    outTerai.bigha  = Math.floor(rem / M2_PER_BIGHA);  rem -= outTerai.bigha  * M2_PER_BIGHA;
    outTerai.kattha = Math.floor(rem / M2_PER_KATTHA); rem -= outTerai.kattha * M2_PER_KATTHA;
    outTerai.dhur   = rem / M2_PER_DHUR;
  } else {
    let rem = m2;
    outHill.ropani = Math.floor(rem / M2_PER_ROPANI); rem -= outHill.ropani * M2_PER_ROPANI;
    outHill.ana    = Math.floor(rem / M2_PER_ANA);    rem -= outHill.ana    * M2_PER_ANA;
    outHill.paisa  = Math.floor(rem / M2_PER_PAISA);  rem -= outHill.paisa  * M2_PER_PAISA;
    outHill.dam    = rem / M2_PER_DAM;
  }

  function swap() {
    setDirection(d => d === 'hillToTerai' ? 'teraiToHill' : 'hillToTerai');
    setHill({ ropani: '', ana: '', paisa: '', dam: '' });
    setTerai({ bigha: '', kattha: '', dhur: '' });
  }

  function loadExample(ex) {
    if (ex.side === 'hill') {
      setDirection('hillToTerai');
      setHill(ex.hill);
      setTerai({ bigha: '', kattha: '', dhur: '' });
    } else {
      setDirection('teraiToHill');
      setTerai(ex.terai);
      setHill({ ropani: '', ana: '', paisa: '', dam: '' });
    }
  }

  const hillActive  = direction === 'hillToTerai';
  const teraiActive = direction === 'teraiToHill';

  // plain numeric string for showing a computed value inside an editable box
  const numStr = (n) => (n ? String(+(+n).toFixed(4)) : '');

  // typing into a side makes it the source (seeding from the current
  // conversion so the shown numbers carry over) and locks the other side
  function editHill(key, val) {
    if (hillActive) {
      setHill(h => ({ ...h, [key]: val }));
    } else {
      const seeded = {
        ropani: numStr(outHill.ropani), ana: numStr(outHill.ana),
        paisa: numStr(outHill.paisa),   dam: numStr(outHill.dam),
      };
      seeded[key] = val;
      setHill(seeded);
      setDirection('hillToTerai');
    }
  }

  function editTerai(key, val) {
    if (teraiActive) {
      setTerai(t => ({ ...t, [key]: val }));
    } else {
      const seeded = {
        bigha: numStr(outTerai.bigha), kattha: numStr(outTerai.kattha),
        dhur: numStr(outTerai.dhur),
      };
      seeded[key] = val;
      setTerai(seeded);
      setDirection('teraiToHill');
    }
  }

  const resultParts = hillActive
    ? [
        { num: fmt(outTerai.bigha,  0), unit: 'bigha'  },
        { num: fmt(outTerai.kattha, 0), unit: 'kattha' },
        { num: fmt(outTerai.dhur,   3), unit: 'dhur'   },
      ]
    : [
        { num: fmt(outHill.ropani, 0), unit: 'ropani' },
        { num: fmt(outHill.ana,    0), unit: 'ana'    },
        { num: fmt(outHill.paisa,  0), unit: 'paisa'  },
        { num: fmt(outHill.dam,    3), unit: 'dam'    },
      ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <header className={styles.header}>
          <div className={styles.logoBlock}>
            <div className={styles.logoTitle}>जग्गा नाप</div>
            <div className={styles.logoSub}>Nepali Land Unit Converter</div>
          </div>
        </header>

        <section className={styles.calc}>

          {/* Hill panel */}
          <div className={`${styles.panel} ${hillActive ? styles.panelActive : ''}`}>
            <div className={styles.panelHead}>
              <div className={styles.panelDeva}>पहाड़</div>
              <div className={styles.panelLabel}>Hill region · Kathmandu, Hills</div>
            </div>
            {HILL_FIELDS.map(({ key, deva, label, step }) => (
              <div key={key} className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.fieldDeva}>{deva}</span>
                  <span className={styles.fieldRoman}>{label}</span>
                </div>
                <input
                  type="number"
                  className={`${styles.input} ${hillActive ? '' : styles.inputReadonly}`}
                  value={hillActive ? hill[key] : numStr(outHill[key])}
                  min="0"
                  step={step}
                  placeholder="0"
                  onChange={e => editHill(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <button
              className={`${styles.swapBtn} ${teraiActive ? styles.swapBtnFlipped : ''}`}
              onClick={swap}
              type="button"
              aria-label="Swap conversion direction"
            >
              ⇄
            </button>
          </div>

          {/* Terai panel */}
          <div className={`${styles.panel} ${teraiActive ? styles.panelActive : ''}`}>
            <div className={styles.panelHead}>
              <div className={styles.panelDeva}>तराई</div>
              <div className={styles.panelLabel}>Terai region · Madhesh, Lowlands</div>
            </div>
            {TERAI_FIELDS.map(({ key, deva, label, step }) => (
              <div key={key} className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span className={styles.fieldDeva}>{deva}</span>
                  <span className={styles.fieldRoman}>{label}</span>
                </div>
                <input
                  type="number"
                  className={`${styles.input} ${teraiActive ? '' : styles.inputReadonly}`}
                  value={teraiActive ? terai[key] : numStr(outTerai[key])}
                  min="0"
                  step={step}
                  placeholder="0"
                  onChange={e => editTerai(key, e.target.value)}
                />
              </div>
            ))}
            {/* spacer to match hill's 4 rows */}
            <div className={styles.fieldSpacer} aria-hidden="true" />
          </div>

        </section>

        {/* Result */}
        <section className={styles.result} aria-live="polite">
          <div className={styles.resultEyebrow}>
            {hillActive ? 'Equivalent in Terai units' : 'Equivalent in Hill units'}
          </div>
          <div className={styles.resultLine}>
            {resultParts.map(({ num, unit }) => (
              <span key={unit}>
                <span className={styles.resultNum}>{num}</span>
                <span className={styles.resultUnit}>{unit}</span>
              </span>
            ))}
          </div>
          <div className={styles.resultMeta}>
            <span>m² <b className={styles.metaVal}>{fmt(m2, 2)}</b></span>
            <span>sq ft <b className={styles.metaVal}>{fmt(m2 * SQFT_PER_M2, 2)}</b></span>
            <span>ha <b className={styles.metaVal}>{fmt(m2 / 10000, 4)}</b></span>
            <span>acres <b className={styles.metaVal}>{fmt(m2 * ACRE_PER_M2, 4)}</b></span>
          </div>
        </section>

        {/* Examples */}
        <section className={styles.examples}>
          <div className={styles.exEyebrow}>Try a sample</div>
          <div className={styles.exTitle}>Common land sizes</div>
          <div className={styles.exGrid}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} className={styles.exBtn} onClick={() => loadExample(ex)}>
                <span className={styles.exDeva}>{ex.label}</span>
                <span className={styles.exRoman}>{ex.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Reference */}
        <section className={styles.reference}>
          <div>
            <div className={styles.refHeading}>
              <span className={styles.refDeva}>पहाड़</span>
              <span className={styles.refRoman}>Hill units</span>
            </div>
            <table className={styles.refTable}>
              <tbody>
                <tr><td>1 Ropani</td><td>16 Ana · 508.737 m²</td></tr>
                <tr><td>1 Ana</td><td>4 Paisa · 31.7856 m²</td></tr>
                <tr><td>1 Paisa</td><td>4 Dam · 7.9464 m²</td></tr>
                <tr><td>1 Dam</td><td>1.9866 m²</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className={styles.refHeading}>
              <span className={styles.refDeva}>तराई</span>
              <span className={styles.refRoman}>Terai units</span>
            </div>
            <table className={styles.refTable}>
              <tbody>
                <tr><td>1 Bigha</td><td>20 Kattha · 6772.63 m²</td></tr>
                <tr><td>1 Kattha</td><td>20 Dhur · 338.63 m²</td></tr>
                <tr><td>1 Dhur</td><td>16.93 m²</td></tr>
                <tr><td>1 Bigha</td><td>≈ 13.31 Ropani</td></tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

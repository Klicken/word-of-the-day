/* Live Swedish entries from Wiktionary. No user data is stored. */
(() => {
  'use strict';
  const API = 'https://en.wiktionary.org/w/api.php';
  const TYPES = {noun:'Noun',verb:'Verb',adjective:'Adjective',adverb:'Adverb'};
  const PLURALS = {noun:'nouns',verb:'verbs',adjective:'adjectives',adverb:'adverbs'};
  const cache = new Map();
  const clean = node => (node?.textContent || '').replace(/\s+/g,' ').trim();

  async function api(parameters, signal) {
    const query = new URLSearchParams({format:'json',formatversion:'2',origin:'*',maxlag:'5',...parameters});
    const response = await fetch(`${API}?${query}`, {signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if (!response.ok) throw new Error(`Wiktionary returned ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.info || 'Wiktionary is unavailable');
    return data;
  }

  // Support both current section-based HTML and older MediaWiki heading layouts.
  function sectionFor(heading) {
    const section = heading.closest('section');
    if (section) return section;
    const container = document.createElement('div');
    const level = Number(heading.tagName.slice(1));
    let element = heading.closest('.mw-heading') || heading;
    container.append(element.cloneNode(true));
    while ((element = element.nextElementSibling)) {
      const nextHeading = /^H[1-6]$/.test(element.tagName) ? element : element.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
      if (nextHeading && Number(nextHeading.tagName.slice(1)) <= level) break;
      container.append(element.cloneNode(true));
    }
    return container;
  }

  function formIn(cell) {
    return clean(cell?.querySelector('[lang="sv"]')) || '';
  }

  function headwordForms(scope) {
    const result = {};
    const headword = scope.querySelector('.headword-line');
    for (const label of headword?.querySelectorAll('i') || []) {
      const value = label.nextElementSibling;
      if (value?.matches('[lang="sv"]')) result[clean(label).toLowerCase()] = clean(value);
    }
    return result;
  }

  function formsFor(scope, title, type) {
    const inline = headwordForms(scope);
    const table = scope.querySelector('table.inflection-table');
    const rows = [...(table?.querySelectorAll('tr') || [])];
    if (type === 'adverb') return [{label:'Unchanged form',value:title}];
    if (type === 'verb') {
      const values = {infinitive:title,present:inline.present,past:inline.preterite,supine:inline.supine};
      for (const row of rows) {
        const label = clean(row.querySelector('th')).replace(/[\d¹²³]/g,'').trim();
        const cells = [...row.querySelectorAll(':scope > td')];
        if (label === 'supine') values.supine ||= cells.map(formIn).find(Boolean);
        if (label === 'indicative') {
          // In deponent tables the active cells are empty; use the populated pair.
          const offset = formIn(cells[0]) ? 0 : 2;
          values.present ||= formIn(cells[offset]);
          values.past ||= formIn(cells[offset+1]);
        }
      }
      if (!values.present || !values.past || !values.supine) return [];
      return ['infinitive','present','past','supine'].map((key,i)=>({label:['Infinitive','Present','Past','Supine'][i],value:values[key]}));
    }
    if (type === 'adjective') {
      const values = {en:'',ett:'',plural:'',comparative:inline.comparative};
      for (const row of rows) {
        const label = clean(row.querySelector('th')).replace(/[\d¹²³]/g,'').trim();
        const cells = [...row.querySelectorAll(':scope > td')];
        if (label === 'common singular') { values.en ||= formIn(cells[0]); values.comparative ||= formIn(cells[1]); }
        if (label === 'neuter singular') values.ett ||= formIn(cells[0]);
        if (label === 'plural') values.plural ||= formIn(cells[0]);
      }
      if (!values.en || !values.ett || !values.plural) return [];
      return ['en','ett','plural','comparative'].filter(key=>values[key]).map(key=>({label:{en:'En form',ett:'Ett form',plural:'Plural / definite',comparative:'Comparative'}[key],value:values[key]}));
    }
    const values = {};
    let number = '';
    for (const row of rows) {
      const labels = [...row.querySelectorAll(':scope > th')].map(clean);
      if (labels.includes('singular')) number = 'singular';
      if (labels.includes('plural')) number = 'plural';
      const definiteness = labels.includes('indefinite') ? 'indefinite' : labels.includes('definite') ? 'definite' : '';
      const value = formIn(row.querySelector('td'));
      if (number && definiteness && value) values[`${number}-${definiteness}`] = value;
    }
    if (!values['singular-indefinite'] || !values['singular-definite']) return [];
    const gender = clean(scope.querySelector('.headword-line .gender'));
    const article = /^n\b/.test(gender) ? 'ett ' : /^c\b/.test(gender) ? 'en ' : '';
    values['singular-indefinite'] = article + values['singular-indefinite'];
    return ['singular-indefinite','singular-definite','plural-indefinite','plural-definite'].filter(key=>values[key]).map(key=>({label:{'singular-indefinite':'Indefinite singular','singular-definite':'Definite singular','plural-indefinite':'Indefinite plural','plural-definite':'Definite plural'}[key],value:values[key]}));
  }

  function safeAudioUrl(value) {
    try { const url = new URL(value,'https://en.wiktionary.org/'); return url.protocol === 'https:' && url.hostname === 'upload.wikimedia.org' ? url.href : ''; }
    catch { return ''; }
  }

  function parseEntry(data, requestedType = 'all') {
    const entry = data.parse;
    const title = entry?.title;
    if (typeof title !== 'string' || !/^[\p{L}][\p{L}-]{1,17}$/u.test(title) || title !== title.toLocaleLowerCase('sv')) return null;
    const html = typeof entry.text === 'string' ? entry.text : entry.text?.['*'];
    if (!html || html.length > 2000000) return null;
    const doc = new DOMParser().parseFromString(html,'text/html');
    const heading = doc.getElementById('Swedish')?.closest('h2');
    if (!heading) return null;
    const language = sectionFor(heading);
    for (const partHeading of language.querySelectorAll('h3, h4, h5')) {
      const type = Object.keys(TYPES).find(key=>TYPES[key] === clean(partHeading));
      if (!type || (requestedType !== 'all' && type !== requestedType)) continue;
      const scope = sectionFor(partHeading);
      if (!scope.querySelector('.headword-line [lang="sv"]')) continue;
      const forms = formsFor(scope,title,type);
      if (!forms.length) continue;
      const glosses = [];
      const examples = [];
      for (const sense of scope.querySelectorAll('ol > li')) {
        if (sense.querySelector('.form-of-definition')) continue;
        const gloss = sense.cloneNode(true);
        gloss.querySelectorAll('dl, ul, ol, table, sup, .reference, .mw-editsection').forEach(node=>node.remove());
        const meaning = clean(gloss);
        if (!meaning || meaning.length > 200 || /\b(archaic|obsolete|nonstandard|misspelling)\b/i.test(meaning)) continue;
        const senseExamples = [];
        for (const example of sense.querySelectorAll('.h-usage-example')) {
          let swedish = clean(example.querySelector('.e-example[lang="sv"]'));
          const english = clean(example.querySelector('.e-translation'));
          // Drop editorial alternatives inside a sentence, retaining the actual example.
          swedish = swedish.replace(/\s*\((?:more|less|literally|lit\.|usually|often|also|formal|colloquial|informal)[^)]*\)/gi,'').trim();
          if (swedish.length < 12 || swedish.length > 190 || swedish.split(/\s+/).length < 3 || english.length < 8 || english.length > 250) continue;
          if (!examples.some(item=>item[0] === swedish) && !senseExamples.some(item=>item[0] === swedish)) senseExamples.push([swedish,english]);
        }
        if (senseExamples.length) { glosses.push(meaning); examples.push(...senseExamples); }
      }
      // Never invent missing examples, translations, or inflections.
      if (examples.length < 2 || !glosses.length) continue;
      const sourceUrl = new URL('https://en.wiktionary.org/w/index.php');
      sourceUrl.searchParams.set('title',title);
      if (Number.isInteger(entry.revid)) sourceUrl.searchParams.set('oldid',entry.revid);
      sourceUrl.hash = 'Swedish';
      const audio = [...language.querySelectorAll('audio source')].sort((a,b)=>(b.type === 'audio/mpeg')-(a.type === 'audio/mpeg')).map(node=>safeAudioUrl(node.getAttribute('src'))).find(Boolean) || '';
      const fileLink = language.querySelector('.audiotable a[href*="File:"]');
      let audioPage = '';
      if (fileLink) {
        const url = new URL(fileLink.getAttribute('href'),'https://en.wiktionary.org/');
        if (url.protocol === 'https:' && ['en.wiktionary.org','commons.wikimedia.org'].includes(url.hostname)) audioPage = url.href;
      }
      return {id:title,type,translation:glosses[0],definition:[...new Set(glosses)].slice(1,3).join('; '),forms,examples:examples.slice(0,2),note:{noun:'En and ett show noun gender. Definite forms mean “the”; plural forms refer to more than one.',verb:'Use the supine with har or hade. Swedish verbs use the same form for every person.',adjective:'Adjectives agree with the noun: use the en, ett, or plural / definite form.',adverb:'Adverbs do not change to agree with a noun.'}[type],source:{url:sourceUrl.href,license:'https://creativecommons.org/licenses/by-sa/4.0/',audio,audioPage}};
    }
    return null;
  }

  async function getWords(type, {signal} = {}) {
    if (type !== 'all' && !TYPES[type]) throw new Error('Unknown word type');
    if (cache.has(type)) return cache.get(type);
    const categories = (type === 'all' ? Object.values(PLURALS) : [PLURALS[type]]).map(value=>'Swedish '+value).join('|');
    const search = await api({action:'query',list:'search',srsearch:`incategory:"${categories}" incategory:"Swedish terms with usage examples"`,srsort:'random',srlimit:'24',srprop:'',srnamespace:'0'},signal);
    const titles = [...new Set((search.query?.search || []).map(item=>item.title))].filter(title=>/^[\p{L}][\p{L}-]{1,17}$/u.test(title) && title === title.toLocaleLowerCase('sv'));
    const words = [];
    let index = 0;
    async function worker() {
      while (index < titles.length && words.length < 8) {
        const title = titles[index++];
        try {
          const data = await api({action:'parse',page:title,prop:'text|revid',disableeditsection:'1'},signal);
          const word = parseEntry(data,type);
          if (word && !words.some(other=>other.id === word.id)) words.push(word);
        } catch (error) { if (signal?.aborted) throw error; }
      }
    }
    await Promise.all([worker(),worker(),worker()]);
    if (signal?.aborted) throw new DOMException('Aborted','AbortError');
    if (words.length < 2) throw new Error('Not enough complete dictionary entries');
    const result = words.slice(0,8);
    cache.set(type,result);
    return result;
  }

  window.WordDictionary = Object.freeze({getWords,parseEntry});
})();

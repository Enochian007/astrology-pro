
const signTone={
Aries:'direct, initiating, and energetic',Taurus:'steady, grounded, and value-oriented',Gemini:'curious, adaptable, and communicative',
Cancer:'protective, intuitive, and emotionally responsive',Leo:'expressive, creative, and self-directed',Virgo:'analytical, practical, and improvement-focused',
Libra:'relational, diplomatic, and balance-seeking',Scorpio:'intense, private, and transformative',Sagittarius:'expansive, candid, and meaning-seeking',
Capricorn:'structured, responsible, and goal-oriented',Aquarius:'independent, conceptual, and future-minded',Pisces:'imaginative, receptive, and compassionate'
};
const planetTheme={
sun:'identity and vitality',moon:'emotional needs and instinctive reactions',mercury:'thinking and communication',venus:'values, attraction, and relating',
mars:'drive, assertion, and action',jupiter:'growth, confidence, and meaning',saturn:'structure, responsibility, and limits',ascendant:'approach, presentation, and first-response style'
};
export function buildInterpretation(natal,transits=[]){
  const key=['sun','moon','mercury','venus','mars','jupiter','saturn'];
  const placements={};
  for(const id of key){
    const p=natal.planets.find(x=>x.id===id);
    if(p) placements[id]=`${p.name} in ${p.zodiac.sign} suggests a ${signTone[p.zodiac.sign]} expression of ${planetTheme[id]}.`;
  }
  if(Number.isFinite(natal.angles?.ascendant)){
    placements.ascendant=`Ascendant in ${natal.ascendantSign.name} describes a ${signTone[natal.ascendantSign.name]} outward style and approach to new situations.`;
  }
  const strongest=(natal.aspects||[]).slice(0,3);
  const dom=natal.dominance;
  const transitText=(transits||[]).slice(0,3).map(a=>`${a.a} ${a.type.toLowerCase()} ${a.b}`).join(', ');
  return {
    placements,
    strongestAspects:strongest,
    overview:`The chart emphasizes ${dom.dominantElement.toLowerCase()} qualities with a ${dom.dominantModality.toLowerCase()} mode. This can be read as a recurring style rather than a fixed outcome.`,
    career:`Career themes may benefit from combining ${dom.dominantElement.toLowerCase()} strengths with the discipline represented by Saturn and the growth orientation represented by Jupiter.`,
    relationships:`Relationship themes are best read through Venus, Mars, the Moon, and the strongest interpersonal aspects. The emphasis here favors conscious communication over prediction.`,
    strengths:`Potential strengths include the chart's ${dom.dominantElement.toLowerCase()} emphasis, ${dom.dominantModality.toLowerCase()} adaptability/style, and the constructive expression of its strongest harmonious aspects.`,
    growthAreas:`Growth may come from balancing overused ${dom.dominantElement.toLowerCase()} tendencies, working deliberately with Saturn themes, and noticing when strong aspects become habitual rather than flexible.`,
    transitSummary:transitText||'No major transit aspects are currently emphasized within the configured orb.',
    disclaimer:'Astrological interpretation is presented for reflection and entertainment, not as scientific fact or deterministic prediction.'
  };
}

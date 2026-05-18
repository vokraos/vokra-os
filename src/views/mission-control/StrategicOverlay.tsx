/** Тонкий стратегический оверлей — угловая телеметрия без лишнего текста */
export function StrategicOverlay() {
  return (
    <div className="mc-ego__strategic-overlay" aria-hidden>
      <span className="mc-ego__strategic-overlay__c mc-ego__strategic-overlay__c--tl" />
      <span className="mc-ego__strategic-overlay__c mc-ego__strategic-overlay__c--tr" />
      <span className="mc-ego__strategic-overlay__c mc-ego__strategic-overlay__c--bl" />
      <span className="mc-ego__strategic-overlay__c mc-ego__strategic-overlay__c--br" />
    </div>
  );
}

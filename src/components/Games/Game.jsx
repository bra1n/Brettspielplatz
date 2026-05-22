export default function Game({id, name, playersMin, playersMax, lengthMin, lengthMax, complexity, bggId, language, childGame, onClick}) {

  return (
    <div className="section--games--game" key={id} onClick={() => onClick(bggId)}>
      <h2 className="supersonic">{name}</h2>
      <p>{`👪 Spieler: ${playersMin || "k.A."} - ${playersMax || "k.A."}`}</p>
      <p>{`⏳ Dauer: ${lengthMin || "k.A."} - ${lengthMax || "k.A."} min.`}</p>
      <p>{`Komplexität (🤪1 - 5🤯): ${Number.parseFloat(complexity).toFixed(1) || "k.A."}`}</p>
      <p>{`📜 Sprache: ${language === "deutsch" ? "🇩🇪" : language === "englisch" ? "🇬🇧" : "k.A."}`}</p>
      {childGame ? <p>{`👶 Kinderspiel!`}</p> : ""}
    </div>
  )
}
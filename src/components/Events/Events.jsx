import "./events.css"
import 'photoswipe/dist/photoswipe.css'
import { Gallery, Item } from 'react-photoswipe-gallery'
import events from '../../assets/events.jpg'
import clocktower from '../../assets/clocktower.webp'

export default function Events() {

  const smallItemStyles = {
    cursor: 'pointer',
    objectFit: 'cover',
    width: '100%',
    height: '100%',
    backgrundColor: 'white'
  }

  return (
    <section className="content maxWidth1200">
      <h1 className="title supersonic">Events</h1>
      <div className="tile shadow">
        <p className="justified">Hier findet ihr eine Auflistung unserer regelmäßig stattfindenden Events. Bei allen sind Neulinge gerne willkommen.
        </p>
        <Gallery>
          <Item
              original={events}
              thumbnail={events}
              width={1300}
              height={900}
              key={1}
            >
              {({ ref, open }) => (
                <img ref={ref} onClick={open} src={events} style={smallItemStyles} />
              )}
            </Item>
        </Gallery>
      </div>
      <h1 className="title supersonic">Team-Events</h1>
      <div className="tile shadow">
        <p className="justified">
          Für alle, die Lust auf ein außergewöhnliches Firmen-Event haben, bieten wir etwas ganz
          Besonderes an: <span className="supersonic">Blood on the Clocktower!</span> Unter
          professioneller Anleitung durch unser Team macht ihr euch auf die Jagd nach einem Dämon,
          schmiedet Intrigen und versucht die Pläne der Bösen zu durchkreuzen. Es sei denn, ihr gehört selbst zu ihnen...
        </p>
        <p className="justified">
          Wir spielen mit euch ein angeleitetes Social-Deduction-Spiel, bei dem ihr in 90 bis 180 Minuten
          lernt, welchen Kollegen man vertrauen kann und wer lügt, ohne dabei das Gesicht zu verziehen.
          Ihr könnt entweder vor 16 Uhr mit mindestens 25 Personen oder nach 16 Uhr mit mindestens 10 Personen spielen - alles
          zum Festpreis und inklusive Snacks und Getränke. Wer will, darf auch gerne auf eigene Kosten ein Catering oder Mittagessen
          organisieren und in den Laden bringen lassen. Schreibt uns bei Interesse einfach eine Mail
          an <a href="mailto:kontakt@brettspielplatz.berlin" target="_blank">kontakt@brettspielplatz.berlin</a>. Wir freuen uns auf euch!
        </p>
        <Gallery>
          <Item
              original={clocktower}
              thumbnail={clocktower}
              width={1920}
              height={950}
              key={1}
            >
              {({ ref, open }) => (
                <img ref={ref} onClick={open} src={clocktower} style={smallItemStyles} />
              )}
            </Item>
        </Gallery>
      </div>
    </section>
  )
}

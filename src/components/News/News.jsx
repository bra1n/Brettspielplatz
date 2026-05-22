import "./news.css"
import { useState, useEffect } from "react"
import { parse } from "csv-parse/browser/esm/sync";
import BeatLoader from 'react-spinners/BeatLoader'

export default function News() {
    const [news, setNews] = useState([])
    const [isLoading, setLoading] = useState(false)

    const SHEET_ID = "1uamZ6CFNVrjcLWGxaUhYijae1KqS3AsewA7qpn1XZhk"

    useEffect(() => {
      async function fetchNews() {
        setLoading(true)

        const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`)
        const data = await response.text()
        setNews(parse(data, { columns: true, skip_empty_lines: true }).slice(0, 10))

        setLoading(false)
      }
      fetchNews()
    }, [])

    const newsElements = news.map(news => {
      return (
        <div className="news shadow" key={news.Date}>
          <img src={news.Image} className="news--image" alt="" />
          <p className="news--date">{news.Date}</p>
          <p className="news--content justified">{(news.Body)}</p>
        </div>
      )
    })

    return (
      <section className="content maxWidth1200">
        <h1 className="title supersonic">Neuigkeiten</h1>
        {isLoading ? (
          <div className="section--news--loader">
            <BeatLoader color={"#00B0B2"}/>
          </div>
          ) :
          (
            <div className="section--news--newsitems">
              {newsElements}
            </div>
            )
          }
      </section>
    )
}

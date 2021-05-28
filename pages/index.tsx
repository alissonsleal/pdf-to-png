import { useCallback, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Document, Page } from 'react-pdf';

export default function Home() {
  const [numPages, setNumPages] = useState(null);
  const [imageUrlArray, setImageUrlArray] = useState([]);
  const [selectedPDFFile, setSelectedPDFFile] = useState();

  const handleImage = useCallback(
    (event: any) => {
      setImageUrlArray([]);
      const file = event.target.files[0];

      !!file?.type?.length && file.type === 'application/pdf'
        ? setSelectedPDFFile(file)
        : !!file?.type?.length &&
          setImageUrlArray((prev) => [prev, URL.createObjectURL(file)]);
    },
    [setSelectedPDFFile, setImageUrlArray, imageUrlArray]
  );

  const onLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    [setNumPages, numPages]
  );

  const onRenderSuccess = useCallback(() => {
    Array.from(new Array(numPages), (el, index) => {
      const importPDFCanvas: HTMLCanvasElement = document.querySelector(
        `.import-pdf-page-${index + 1} canvas`
      );

      importPDFCanvas.toBlob((blob) => {
        setImageUrlArray((prev) => [...prev, URL.createObjectURL(blob)]);
      });
    });
  }, [numPages, setImageUrlArray, imageUrlArray]);

  return (
    <div className={styles.container}>
      <Head>
        <title>PDF to PNG</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>PDF to PNG client-side conversion</h1>
        <label htmlFor="upload" className={styles.download}>
          Upload PDF
        </label>
        <input
          style={{ display: 'none' }}
          id="upload"
          type="file"
          onChange={handleImage}
        />

        {selectedPDFFile && (
          <div style={{ display: 'none', width: '100vw' }}>
            {/* <div style={{ width: '100vw' }}> */}
            <Document file={selectedPDFFile} onLoadSuccess={onLoadSuccess}>
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  className={`import-pdf-page-${index + 1}`}
                  onRenderSuccess={onRenderSuccess}
                  width={1024}
                />
              ))}
            </Document>
          </div>
        )}

        {!!imageUrlArray.length &&
          imageUrlArray.map((image, index) => (
            <div key={`page_${index + 1}`} className={styles.imageContainer}>
              <img
                className={styles.image}
                src={image}
                style={{ width: '50vw' }}
              />
              <a className={styles.download} href={image} download>
                download file
              </a>
            </div>
          ))}
      </main>
    </div>
  );
}

import { useCallback, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Document, Page } from 'react-pdf';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [imageUrlArray, setImageUrlArray] = useState(null);
  const [selectedPDFFile, setSelectedPDFFile] = useState();

  const handleImage = useCallback(
    (event: any) => {
      setImageUrlArray([]);
      const file = event.target.files[0];

      if (!!file?.type?.length && file.type === 'application/pdf') {
        setIsLoading(true);
        setSelectedPDFFile(file);
      } else if (!!file?.type?.length) {
        setImageUrlArray([URL.createObjectURL(file).toString()]);
      }
    },
    [
      setSelectedPDFFile,
      setImageUrlArray,
      imageUrlArray,
      setIsLoading,
      isLoading,
    ]
  );

  const onLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
    },
    [setNumPages, numPages, setIsLoading]
  );

  const onRenderSuccess = useCallback(
    (pageIndex) => {
      Array.from(new Array(numPages), (el, index) => {
        const importPDFCanvas: HTMLCanvasElement = document.querySelector(
          `.import-pdf-page-${index + 1} canvas`
        );

        pageIndex === index &&
          importPDFCanvas.toBlob((blob) => {
            setImageUrlArray((prev: string) => [
              ...prev,
              URL.createObjectURL(blob),
            ]);
          });
      });
    },
    [numPages, setImageUrlArray, imageUrlArray]
  );

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

        {isLoading && <div className={styles.loader} />}

        {selectedPDFFile && (
          <div style={{ display: 'none', width: '100vw' }}>
            <Document
              file={selectedPDFFile}
              onLoadSuccess={onLoadSuccess}
              loading={'wait'}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  className={`import-pdf-page-${index + 1}`}
                  onRenderSuccess={() => onRenderSuccess(index)}
                  width={1024}
                />
              ))}
            </Document>
          </div>
        )}

        {!!imageUrlArray?.length &&
          imageUrlArray.map((image: string, index: number) => (
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

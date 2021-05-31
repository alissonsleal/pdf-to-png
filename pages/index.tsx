import { useCallback, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Document, Page, pdfjs } from 'react-pdf';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [imageUrlArray, setImageUrlArray] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [selectedPDFFile, setSelectedPDFFile] = useState();

  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const handleImage = useCallback(
    (event: any) => {
      setImageUrlArray([]);
      const file = event.target.files[0];

      if (!!file?.type?.length && file.type === 'application/pdf') {
        setIsLoading(true);
        setSelectedPDFFile(file);
      } else if (!!file?.type?.length) {
        setFileType('image');
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
          <div className={styles.image}>
            <Document
              file={selectedPDFFile}
              onLoadSuccess={onLoadSuccess}
              error={<div>An error occurred!</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <>
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    className={`import-pdf-page-${index + 1} ${styles.image} ${
                      fileType === 'image' && styles.none
                    }`}
                    onRenderSuccess={() => onRenderSuccess(index)}
                    width={1024}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    error={<div>An error occurred!</div>}
                  />
                  {imageUrlArray[index] && (
                    <a
                      className={styles.download}
                      href={imageUrlArray[index]}
                      download
                    >
                      download file
                    </a>
                  )}
                </>
              ))}
            </Document>
          </div>
        )}

        {!!imageUrlArray?.length &&
          fileType === 'image' &&
          imageUrlArray.map((image: string, index: number) => (
            <div key={`page_${index + 1}`} className={styles.imageContainer}>
              <img className={styles.image} src={image} />
              <a className={styles.download} href={image} download>
                download file
              </a>
            </div>
          ))}
      </main>
    </div>
  );
}

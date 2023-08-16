// Copyright (c) 2023 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {useEffect, useState, useRef} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {format} from 'd3-format';
import {LoadingDialog} from '@kepler.gl/components';
import {FormattedMessage} from 'react-intl';
import {ref, getDownloadURL, listAll, uploadBytesResumable} from 'firebase/storage';
import {db, storage} from '../../utils/firebase';
import {doc, setDoc, getDocs, where, collection, query, onSnapshot} from 'firebase/firestore';

const numFormat = format(',');

const StyledSampleGallery = styled.div`
  display: flex;
  gap: 20px;
  //justify-content: space-between;
  flex-wrap: wrap;
`;

const StyledSampleMap = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.textColorLT};
  line-height: 22px;
  width: 30%;
  max-width: 480px;
  margin-bottom: 50px;

  .sample-map__image {
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
    opacity: 0.9;
    transition: opacity 0.4s ease;
    position: relative;
    line-height: 0;

    img {
      max-width: 100%;
    }
    :hover {
      cursor: pointer;
      opacity: 1;
    }
  }

  .sample-map__size {
    font-size: 12px;
    font-weight: 400;
    line-height: 24px;
  }

  :hover {
    .sample-map__image__caption {
      opacity: 0.8;
      transition: opacity 0.4s ease;
    }
  }
`;

const StyledImageCaption = styled.div`
  color: ${props => props.theme.labelColorLT};
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  margin-top: 10px;
  opacity: 0;
`;

const StyledError = styled.div`
  color: red;
  font-size: 14px;
  margin-bottom: 16px;
`;

const SampleMap = ({id, sample, onClick, locale}) => (
  <StyledSampleMap id={id} className="sample-map-gallery__item">
    <div className="sample-map">
      <div className="sample-map__image" onClick={onClick}>
        {sample.imageUrl && <img src={sample.imageUrl} />}
      </div>
      <div className="sample-map__title">{sample.label}</div>
      <div className="sample-map__size">
        <FormattedMessage
          id={'sampleDataViewer.rowCount'}
          values={{rowCount: numFormat(sample.size)}}
        />
      </div>
      <StyledImageCaption className="sample-map__image__caption">
        {sample.description}
      </StyledImageCaption>
    </div>
  </StyledSampleMap>
);

const SampleMapGallery = ({
  sampleMaps,
  onLoadSample,
  error,
  isMapLoading,
  locale,
  loadSampleConfigurations
}) => {
  const [storageItems, setStorageItems] = useState([]);
  // useEffect(() => {
  //   if (!sampleMaps.length) {
  //     loadSampleConfigurations();
  //   }
  // }, [sampleMaps, loadSampleConfigurations]);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, 'rawDataStreams'), where('downloadURL', '!=', null));
      const unsubscribe = onSnapshot(q, snapshot => {
        const data = snapshot.docs.map(doc => doc.data());
        setSamples(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  }, []);

  // const fetchData = async () => {
  //   const q = query(collection(db, 'rawDataStreams'), where('downloadURL', '!=', null));
  //   const collectionDT = await getDocs(q);
  //
  //   const data = collectionDT.docs.map(doc => doc.data());
  //
  //   setSamples(data);
  // };

  const inputHandler = () => {
    inputRef.current.click();
  };
  //
  const handleCsvChange = e => {
    e.preventDefault();
    const reader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;
    if (file !== undefined) {
      reader.onloadend = () => {
        csvUploadApi(file, async url => {
          await csvDataHandle_(file.name, url);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const csvUploadApi = (imageAsFile, imageDataHandle) => {
    setLoading(true);
    const storageRef = ref(storage, `/glCsv/${imageAsFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, imageAsFile);

    return uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      err => {
        console.log(err);
        setLoading(false);
      },
      () =>
        getDownloadURL(uploadTask.snapshot.ref)
          .then(downloadUrl => {
            imageDataHandle(downloadUrl);
          })
          .then(() => {
            setLoading(false);
          })
          .catch(e => {
            console.log(e);
            setLoading(false);
          })
    );
  };

  const csvDataHandle_ = (name, downloadURL) => {
    const today = new Date();
    return setDoc(doc(db, 'rawDataStreams', today.getTime().toString()), {
      name,
      downloadURL,
      timestamp: today
    });
  };

  // const listStorage = async () => {
  //   console.log('list');
  //   const listRef = ref(storage, 'gs://eco-web-gis.appspot.com/');
  //   listAll(listRef)
  //     .then(res => {
  //       console.log(res);
  //       // res.prefixes.forEach(folderRef => {
  //       //   console.log(folderRef);
  //       //   // All the prefixes under listRef.
  //       //   // You may call listAll() recursively on them.
  //       // });
  //       setStorageItems(res.items);
  //     })
  //     .catch(error => {
  //       console.log(error);
  //       // Uh-oh, an error occurred!
  //     });
  // };

  const onClickCsvLoader = downloadUrl => {
    try {
      onLoadSample({dataUrl: downloadUrl});
    } catch (e) {
      console.log(e);
    }
    // getDownloadURL(ref(storage, `gs://eco-web-gis.appspot.com/${downloadUrl}`))
    //   .then(csvUrl => {
    //     onLoadSample({dataUrl: csvUrl});
    //   })
  };
  if (loading) {
    return <LoadingDialog size={64} />;
  }

  return (
    <div className="sample-data-modal">
      {error ? (
        <StyledError>{error.message}</StyledError>
      ) : isMapLoading ? (
        <LoadingDialog size={64} />
      ) : (
        <div>
          {/*{sampleMaps*/}
          {/*  .filter(sp => sp.visible)*/}
          {/*  .map(sp => (*/}
          {/*    <SampleMap*/}
          {/*      id={sp.id}*/}
          {/*      sample={sp}*/}
          {/*      key={sp.id}*/}
          {/*      onClick={() => onLoadSample(sp)}*/}
          {/*      locale={locale}*/}
          {/*    />*/}
          {/*  ))}*/}
          <StyledSampleGallery className="sample-map-gallery">
            {samples.map(item => (
              <div
                style={{
                  cursor: 'pointer',
                  padding: '20px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
                key={item.downloadURL}
                onClick={() => onClickCsvLoader(item.downloadURL)}
              >
                <p>{item.name}</p>
              </div>
            ))}
          </StyledSampleGallery>
          <button
            style={{
              marginTop: '20px',
              cursor: 'pointer',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '10px',
              backgroundColor: '#E9EAFEFF'
            }}
            onClick={() => {
              inputHandler();
            }}
          >
            Add csv
          </button>
          <input
            onChange={e => handleCsvChange(e)}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            ref={inputRef}
            type="file"
            style={{display: 'none'}}
          />
        </div>
      )}
    </div>
  );
};

SampleMapGallery.propTypes = {
  sampleMaps: PropTypes.arrayOf(PropTypes.object),
  onLoadSample: PropTypes.func.isRequired,
  loadSampleConfigurations: PropTypes.func.isRequired,
  error: PropTypes.object
};

export default SampleMapGallery;

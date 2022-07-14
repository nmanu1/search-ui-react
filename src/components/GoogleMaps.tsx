import { Wrapper } from '@googlemaps/react-wrapper';
import { Result, useAnswersState } from '@yext/answers-headless-react';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { twMerge, useComposedCssClasses } from '../hooks/useComposedCssClasses';
import { getGoogleMapsLanguage } from './utils/processLocale';

/**
 * CSS class interface for the {@link GoogleMaps} component
 *
 * @public
 */
export interface GoogleMapsCssClasses {
  mapElement?: string
}

/**
 * Props for the {@link GoogleMaps} component
 *
 * @public
 */
export interface GoogleMapsProps {
  apiKey: string,
  centerLatitude: number,
  centerLongitude: number,
  defaultZoom: number,
  showEmptyMap: boolean,
  locale: string,
  providerOptions?: google.maps.MapOptions,
  customCssClasses?: GoogleMapsCssClasses
}

const builtInCssClasses: Readonly<GoogleMapsCssClasses> = {
  mapElement: 'h-96 mb-6'
};

/**
 * A component that renders a map with markers to show result locations.
 *
 * @param props - {@link GoogleMapsProps}
 * @returns A React element conatining a Google Map
 *
 * @public
 */
export function GoogleMaps(props: GoogleMapsProps) {
  const language = getGoogleMapsLanguage(props.locale);
  return (
    <div>
      <Wrapper apiKey={props.apiKey} language={language}>
        <UnwrappedGoogleMaps {...props} />
      </Wrapper>
    </div>
  );
}

function UnwrappedGoogleMaps({
  centerLatitude,
  centerLongitude,
  defaultZoom: zoom,
  showEmptyMap,
  providerOptions,
  customCssClasses
}: GoogleMapsProps) {

  const cssClasses = useComposedCssClasses(builtInCssClasses, customCssClasses);

  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [center] = useState<google.maps.LatLngLiteral>({
    lat: centerLatitude,
    lng: centerLongitude
  });

  useEffect(() => {
    if (ref.current && !map) {
      setMap(new window.google.maps.Map(ref.current, {
        center,
        zoom,
      }));
    }
  }, [center, map, zoom]);

  useEffect(() => {
    map?.fitBounds(bounds);
    map?.panToBounds(bounds);
    const zoom = map?.getZoom() ?? 0;
    if (zoom > 15) {
      map?.setZoom(15);
    }
  });

  const locationResults = useAnswersState(state => state.vertical.results) || [];
  const noResults = !locationResults.length;

  const bounds = new google.maps.LatLngBounds(); // maybe need to put back ref?
  const markers = useRef<google.maps.Marker[]>([]);
  deleteMarkers();

  for (const result of locationResults) {
    const position = getPosition(result);
    const marker = new google.maps.Marker({
      position,
      map
    });

    const location = new google.maps.LatLng(position.lat, position.lng);
    bounds.extend(location);
    markers.current.push(marker);
  }

  function deleteMarkers(): void {
    for (let i = 0; i < markers.current.length; i++) {
      markers.current[i].setMap(null);
    }
    markers.current = [];
  }

  let mapElementCssClasses = cssClasses.mapElement;
  if (noResults && !showEmptyMap) {
    mapElementCssClasses = twMerge(cssClasses.mapElement, 'hidden');
  }

  return (
    <div className={mapElementCssClasses} ref={ref} />
  );
}

function getPosition(result: Result){
  const lat = (result.rawData as any).yextDisplayCoordinate.latitude;
  const lng = (result.rawData as any).yextDisplayCoordinate.longitude;
  return { lat, lng };
}

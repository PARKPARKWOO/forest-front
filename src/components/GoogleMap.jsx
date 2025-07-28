import { useEffect, useRef } from 'react';

export default function GoogleMap({ address, className = "w-full h-96" }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const googleMapApiKey = import.meta.env.GOOGLE_MAP_API_KEY;
    
    if (!googleMapApiKey) {
      console.error('Google Maps API 키가 설정되지 않았습니다.');
      return;
    }

    // Google Maps API 스크립트가 이미 로드되었는지 확인
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      // Google Maps API 스크립트 로드
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    }

    function initializeMap() {
      if (!mapRef.current) return;

      // 주소를 좌표로 변환
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          
          // 지도 생성
          const map = new window.google.maps.Map(mapRef.current, {
            center: location,
            zoom: 17,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          // 마커 추가
          const marker = new window.google.maps.Marker({
            position: location,
            map: map,
            title: address,
            animation: window.google.maps.Animation.DROP
          });

          // 정보창 추가
          const infowindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px;">
                <h3 style="margin: 0 0 5px 0; font-weight: bold;">전북생명의숲</h3>
                <p style="margin: 0; color: #666;">${address}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infowindow.open(map, marker);
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
        } else {
          console.error('주소를 찾을 수 없습니다:', status);
        }
      });
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [address]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-sm" />
    </div>
  );
} 
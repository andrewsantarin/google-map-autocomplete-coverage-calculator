import React from 'react';
import GoogleMap from 'google-map-react';
import GoogleAutocomplete from 'react-google-autocomplete';
import { Form, Message, Modal } from 'semantic-ui-react';

import GoogleMapMarker from './GoogleMapMarker';

// lustrous-acumen-132523
// AIzaSyDq38-QJCuQZk8-QoTeuLO-diT-HCPohCA
// https://maps.googleapis.com/maps/api/js?key=AIzaSyDq38-QJCuQZk8-QoTeuLO-diT-HCPohCA&libraries=places

// striking-bot-125007
// AIzaSyDml6rqKwjgQgPomyAhC-WxVt4aLodlraU
// https://maps.googleapis.com/maps/api/js?key=AIzaSyDml6rqKwjgQgPomyAhC-WxVt4aLodlraU&libraries=places


const CONTAINER_STYLE = {
  height: '100%',
  width: '100%',
};
const GOOGLE_MAP_DEFAULT_PROPS = {
  defaultCenter: {
    lat: 3.0734735,
    lng: 101.5603764,
  },
  defaultZoom: 14,
  bootstrapURLKeys: {
    libraries: 'drawing',
    key: 'AIzaSyDq38-QJCuQZk8-QoTeuLO-diT-HCPohCA',
  },
};
const GOOGLE_AUTOCOMPLETE_DEFAULT_PROPS = {
  style: {
    width: '100%',
  },
  placeholder: 'Enter location, e.g. 32, Jalan Mutiara Subang 3',
  types: [],
  componentRestrictions: {
    country: 'MY',
  },
};
const OFFSET = 0.00625;
const SURCHARGE_OFFSET = OFFSET * 1.5;
const SURCHARGE_OFFSET_2 = OFFSET * 2;


export class GoogleMapsCoverageCalculator extends React.Component {
  state = {
    google: null,
    coverageAreas: [],
    markers: [],
    coverageLevel: null,
  };

  handlePlaceSelected = (place) => {
    const { location } = place.geometry;
    const { lat, lng } = location;
    const coords = {
      lat: lat(),
      lng: lng(),
    };

    const { google, coverageAreas } = this.state;

    // Calculate the coverageLevel according to priority.
    const coverageLevel = coverageAreas.reduce((coverageLevel, coverageArea, index) => {
      return google.maps.geometry.poly.containsLocation(
        location,
        coverageArea
      ) ? coverageAreas.length - 1 - index : coverageLevel;
    }, -1);

    // Clear the previous Google Maps marker, then assign a fresh one to the list.
    let { markers } = this.state;
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    const marker = new google.maps.Marker({
      position: location,
      map: google.map,
      title: 'Your place.'
    });
    markers = [marker];

    this.setState((prevState, props) => ({
      coverageLevel,
      coords,
      markers,
    }));
  }

  handleGoogleMapApiLoaded = (google) => {
    const { defaultCenter: DEFAULT_CENTER } = GOOGLE_MAP_DEFAULT_PROPS;
    const { lat: DEFAULT_LAT, lng: DEFAULT_LNG } = DEFAULT_CENTER;

    const coverageAreas = [
      {
        color: '#FF0000',
        paths: [
          { lat: DEFAULT_LAT - SURCHARGE_OFFSET_2, lng: DEFAULT_LNG - SURCHARGE_OFFSET_2 },
          { lat: DEFAULT_LAT + SURCHARGE_OFFSET_2, lng: DEFAULT_LNG - SURCHARGE_OFFSET_2 },
          { lat: DEFAULT_LAT + SURCHARGE_OFFSET_2, lng: DEFAULT_LNG + SURCHARGE_OFFSET_2 },
          { lat: DEFAULT_LAT - SURCHARGE_OFFSET_2, lng: DEFAULT_LNG + SURCHARGE_OFFSET_2 },
        ],
      },
      {
        color: '#00FF00',
        paths: [
          { lat: DEFAULT_LAT, lng: DEFAULT_LNG - SURCHARGE_OFFSET },
          { lat: DEFAULT_LAT + SURCHARGE_OFFSET, lng: DEFAULT_LNG - SURCHARGE_OFFSET },
          { lat: DEFAULT_LAT + SURCHARGE_OFFSET, lng: DEFAULT_LNG + SURCHARGE_OFFSET },
          { lat: DEFAULT_LAT, lng: DEFAULT_LNG + SURCHARGE_OFFSET },
        ],
      },
      {
        color: '#0000FF',
        paths: [
          { lat: DEFAULT_LAT, lng: DEFAULT_LNG - OFFSET },
          { lat: DEFAULT_LAT + OFFSET, lng: DEFAULT_LNG - OFFSET },
          { lat: DEFAULT_LAT + OFFSET, lng: DEFAULT_LNG + OFFSET },
          { lat: DEFAULT_LAT, lng: DEFAULT_LNG + OFFSET },
        ],
      },
    ].map(({ color, ...configs }) => ({
      ...configs,
      strokeColor: color,
      fillColor: color,
    }))
      .map((configs) => new google.maps.Polygon({
        ...configs,
        map: google.map,
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillOpacity: 0.35,
        draggable: false,
        editable: false,
        geodesic: false,
      }));

    this.setState((prevState, props) => ({
      google,
      coverageAreas,
    }));
  }

  renderCoverageAreaMessage = (coverageLevel) => {
    // Ignore blank `coverageLevel`.
    if (coverageLevel === null) return;
    switch (coverageLevel) {
      case -1:
        return (
          <div style={{ fontSize: '.75em', marginTop: -15, padding: 4, color: 'white', fontWeight: 700, backgroundColor: '#ff3300' }}>
            Your area is still out of reach at the moment.
          </div>
        );

      case 0:
        return (
          <div style={{ fontSize: '.75em', marginTop: -15, padding: 4, color: 'white', fontWeight: 700, backgroundColor: '#6cc045' }}>
            Your area is served!
          </div>
        );

      default:
        return (
          <div style={{ fontSize: '.75em', marginTop: -15, padding: 4, color: 'white', fontWeight: 700, backgroundColor: '#ffb100' }}>
            Your area has surcharges.
            {' '}
            <Modal closeIcon closeOnDimmerClick dimmer trigger={<a href="#" onClick={event => { event.preventDefault(); }}>Read more</a>}>
              <Modal.Header>Surcharges</Modal.Header>
              <Modal.Content>
                <Modal.Description>
                  <p>Due to the larger distances involved, delivery costs will increase.</p>
                  <p>Here's is a list of surcharges:</p>
                  <ul>
                    <li>Red zone: RM10</li>
                    <li>Green zone: RM5</li>
                    <li>Blue zone is <strong>FREE</strong> of surcharges.</li>
                  </ul>
                </Modal.Description>
              </Modal.Content>
            </Modal>
          </div>
        );
    }
  }

  render() {
    const { coverageLevel, markers = [] } = this.state;
    const [marker = {}] = markers;
    const { position = {} } = marker;
    const { lat, lng } = position;
    const coords = markers[0]
      ? {
        lat: lat(),
        lng: lng(),
      }
      : null;

    return (
      <div style={CONTAINER_STYLE}>
        <Form style={{ position: 'absolute', zIndex: 100, width: '100%', padding: 15 }}>
          <Form.Field
            control={GoogleAutocomplete}
            {...GOOGLE_AUTOCOMPLETE_DEFAULT_PROPS}
            onPlaceSelected={this.handlePlaceSelected}
          />
          {this.renderCoverageAreaMessage(coverageLevel)}
        </Form>
        <GoogleMap
          {...GOOGLE_MAP_DEFAULT_PROPS}
          center={coords}
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={this.handleGoogleMapApiLoaded}
        >
          {coords && (
            <GoogleMapMarker {...coords} onClick={() => alert('Hello!')}>
              <span style={{ backgroundColor: 'white', padding: 4 }}>You</span>
            </GoogleMapMarker>
          )}
        </GoogleMap>
      </div>
    );
  }
}

export default GoogleMapsCoverageCalculator;

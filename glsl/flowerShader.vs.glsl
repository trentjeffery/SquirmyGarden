varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 incomingLight;
varying vec3 reflectVec;
varying vec3 viewVec;

uniform vec3 lightPosition;


void main() {
	//put things in the right coordinate system
	vec3 realNormal = normalize(normalMatrix * normal);
	vec3 realPosition = vec3(modelViewMatrix * vec4(position,1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);


    //get interpolated vectors
    interpolatedNormal = realNormal;
    interpolatedPosition = realPosition;

}


  

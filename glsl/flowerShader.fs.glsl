varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;

uniform vec3 ambientColor;
uniform vec3 lightColor;
uniform vec3 lightPosition;
uniform float shininess;

void main() {

	//make k vectors to represent colour of material
	vec3 KaVec = vec3(Ka,Ka,Ka); 
	vec3 KdVec = vec3(Kd,Kd,Kd);
	vec3 KsVec = vec3(Ks,Ks,Ks);

	//make vectors for later use in diffuse/specular components
	vec3 incomingLight = normalize(lightPosition - interpolatedPosition);
	vec3 viewVec = normalize( -1.0* interpolatedPosition);
	vec3 reflectVec = normalize(-1.0 *incomingLight + 2.0 * interpolatedNormal * max(dot(incomingLight, interpolatedNormal), 0.0));

	//calculate components of the light
	vec3 diffuse = vec3(lightColor)* max(0.0,dot(interpolatedNormal, incomingLight));
	vec3 specular = lightColor * pow(max(0.0, dot(viewVec, reflectVec)),shininess);

	//put it all together!!
	vec3 fragColor = vec3(ambientColor)*KaVec + diffuse*KdVec + specular*KsVec;
	gl_FragColor = vec4(fragColor, 1.0);
}

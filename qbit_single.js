
var states = ["+1", "-1"];
var state_values = [1, -1];
var init_vec = tf.tensor1d([0.0, 0.0, 1.0]); //pointing in +z direction
var state_vec = init_vec;

var init_measure_vec = angle_to_unit_vec(0.0, 0.0);
var measure_vec = init_measure_vec;

document.addEventListener("DOMContentLoaded", function(event) { 
  update_state(state_vec, null);
  update_measurement(null, measure_vec);
});

function update_measurement(measurement_idx, measure_vec) {
  if(measure_vec != null) { 
    document.getElementById("measure_vec").innerHTML = "[" + measure_vec.arraySync() + "]";
  } else {
    document.getElementById("measure_vec").innerHTML = "";
  }
  
  if(measurement_idx != null) {
    document.getElementById("measurement").innerHTML = states[measurement_idx];
  } else {
    document.getElementById("measurement").innerHTML = "";
  }
}

function update_state(svec, measurement_idx) {
  state_vec = svec;
  
  document.getElementById("state").innerHTML = "[" + state_vec.arraySync() + "]";
  //update_state_viz(state_vec.arraySync());

  if(measurement_idx == null) {
    document.getElementById("along").style.display = "none";
    document.getElementById("opposite").style.display = "none";
    document.getElementById("waiting").style.display = "inline";
  }
  else {
    var measurement = state_values[measurement_idx];
    document.getElementById("waiting").style.display = "none";
    if (measurement == 1) {
      document.getElementById("along").style.display = "inline";
      document.getElementById("opposite").style.display = "none";
    } else {
      document.getElementById("along").style.display = "none";
      document.getElementById("opposite").style.display = "inline";
    }
 }
}

function reset_state() {
  state_vec = init_vec;
  update_state(state_vec, null);

  align_measurement();
  //measure_vec = init_measure_vec;
  //update_measurement(null, init_measure_vec);

  //update_anim(state_vec.arraySync(), measure_vec.arraySync());
}

function reset_direction() {
  document.getElementById("alpha_text").value = 0;
  document.getElementById("beta_text").value = 0;

  reset_state();
}

function align_measurement(){
  measure_vec = get_measure_vec();
  update_measurement(null, measure_vec);

  update_anim(state_vec.arraySync(), measure_vec.arraySync());
}

//Ref - https://www.w3resource.com/javascript-exercises/javascript-math-exercise-33.php
function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180.0);
}

function angle_to_unit_vec(alpha, beta) {

  //because strange p5 coordinate system
  alpha = alpha - degrees_to_radians(90);

	var x = tf.mul(tf.cos(beta), tf.sin(alpha));
  var x2 = x.dataSync()[0];
  var y = tf.mul(tf.cos(beta), tf.cos(alpha));
  var y2 = y.dataSync()[0];
  var z = tf.sin(beta);
  var z2 = z.dataSync()[0];
  //console.log(x2[0]);
  var t =  tf.tensor1d([x2, y2, z2]);
  //t.print();
  
  return t
}

function unit_vec_to_angle(vec) {

}

function measure(state_vec, measure_vec) {
  //console.log("state = " + state_vec + " measure = " + measure_vec);
	var expected_value = tf.dot(state_vec, measure_vec).dataSync()[0];
  
  //console.log("expected_value = " + expected_value);
  var up_prob = Math.min((1 + expected_value)/2.0, 1.0);
  //console.log("up_prob = " + up_prob);
  var measurement_idx = tf.multinomial([up_prob, 1 - up_prob], 1, seed=null, normalized=true);
  //console.log("probs = [" + up_prob + ", " + (1 - up_prob) + "]");
  //console.log("TF sampled " + measurement);
  return measurement_idx.dataSync()[0];
}

function get_measure_vec() {
	var alpha_deg = Number(document.getElementById("alpha_text").value);
  var beta_deg = Number(document.getElementById("beta_text").value);
  

  var alpha = degrees_to_radians(alpha_deg);
  var beta = degrees_to_radians(beta_deg);
  
  var measure_vec = angle_to_unit_vec(alpha, beta);
  
  return measure_vec;
}

function calculate_result() {
  var measure_vec = get_measure_vec();
  var measurement_idx = measure(state_vec, measure_vec);
  
  var measurement = state_values[measurement_idx];
  state_vec = measure_vec.mul(measurement);
  
  update_measurement(measurement_idx, measure_vec);
  update_state(state_vec, measurement_idx);
  update_anim(state_vec.arraySync(), measure_vec.arraySync());
  //document.getElementById("result").innerHTML = " measurement = " + measurement + " <br/>state = [" + state_vec.arraySync() + "]";
}

function start_experiment() {
  
  //update_measurement(null, null);
  //update_state(state_vec, null);

	var measure_vec = get_measure_vec();
  var start_vec = state_vec;
  //align_measurement();

  var n_times = parseInt(document.getElementById("n_times_text").value);
  
  measure_counts = {};
  for(const state of states){
  	measure_counts[state] = 0;
  }
  
  generate_vis(measure_counts, measure_vec, start_vec, n_times);
  
}

function run_experiment(measure_counts, measure_vec, start_vec, n_times, res, n_tot) {
	//console.log("Running Experiment " + n_times + " times");

  if (n_times > 0) {
    var measurement_idx = measure(start_vec, measure_vec);
    var measurement_state = states[measurement_idx];
    measure_counts[measurement_state] += 1;
    setTimeout(function() { update_vis(measure_counts, measure_vec, start_vec, n_times, res, measurement_idx, n_tot)}, 100);
    document.getElementById("sim_value").innerHTML = (n_tot - n_times + 1) + "/" + n_tot;
    
  }
  else {
    update_state(start_vec, null);
    update_measurement(null, measure_vec);
  }
  var count_arr = [];
  var total_times = 0;
  for (const st of states) {
    count_arr.push(measure_counts[st]);
    total_times += measure_counts[st];
  }

  for(var i = 0; i < count_arr.length; i++) {
    count_arr[i] /= total_times;
  }
  
  //console.log(state_values);
  //console.log(count_arr);
  document.getElementById("theory_value").innerHTML = tf.dot(start_vec, measure_vec).dataSync()[0].toFixed(4);
  document.getElementById("exp_value").innerHTML = tf.dot(tf.tensor(state_values), tf.tensor(count_arr)).dataSync()[0].toFixed(4);
  //document.getElementById("expected_value").innerHTML = "Theoretical Expected Value = " +  + " Experiment average = " + 
  

}

function update_vis(measure_counts, measure_vec, start_vec, n_times, res, measurement_idx, total_times) {
	//console.log("Updating vis " + JSON.stringify(measure_counts));
  
  var measurement_state_int = state_values[measurement_idx];
  var display_state_vec = tf.mul(measure_vec, measurement_state_int);
  update_state(display_state_vec, measurement_idx);
  update_measurement(measurement_idx, measure_vec);
  update_anim(display_state_vec.arraySync(), measure_vec.arraySync());
  
	var values = [];
  for(const [state, count] of Object.entries(measure_counts)) {
  	values.push({state: state, count: count});
  }
  
	var change_set = vega
  .changeset()
  .remove(function() { return true;})
  .insert(values);
  
  res.view.change('hist', change_set).run()
  
  run_experiment(measure_counts, measure_vec, start_vec, n_times - 1, res, total_times);
}

function generate_vis(measure_counts, measure_vec, start_vec, n_times) {
  var values = [];
  for(const [state, count] of Object.entries(measure_counts)) {
  	values.push({state: state, count: count});
  }
  
	var vis_spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 200,
        height: 200,
        description: 'Bar chart of measurement counts',
        data: {
          name: 'hist',
          values: values
        },
        mark: 'bar',
        encoding: {
          x: {
            field: 'state', 
            type: 'ordinal',
            axis: {labelFontSize: 20, titleFontSize:25}
          },
          y: {
            field: 'count', 
            type: 'quantitative', 
            scale: {domain: [0, n_times]},
            axis: {labelFontSize: 20, titleFontSize:25}
          }
        }
      };
      vegaEmbed('#hist_vis', vis_spec).then(function (res) {
      	run_experiment(measure_counts, measure_vec, start_vec, n_times, res, n_times);
      });
}

function run_hamilton() {
  var mag_vec = tf.tensor1d([0.0, 0.0, 1.0]);
  var meas_vec = get_measure_vec();

  var z_dir = tf.tensor1d([0.0, 0.0, 1.0]);
  var y_dir = tf.tensor1d([0.0, 1.0, 0.0]);
  var x_dir = tf.tensor1d([1.0, 0.0, 0.0]);
  
  console.log(tf.dot(meas_vec, x_dir).dataSync()[0]);
  console.log(x_dir.mul(tf.dot(meas_vec, x_dir).dataSync()[0]).arraySync());
  var sigma_x = tf.dot(meas_vec, x_dir).dataSync()[0];
  var sigma_y = tf.dot(meas_vec, y_dir).dataSync()[0];
  var sigma_z = tf.dot(meas_vec, z_dir).dataSync()[0];
  
  console.log(sigma_x, sigma_y, sigma_z);

  var sigma_x_0 = sigma_x;
  var sigma_y_0 = sigma_y;
  var sigma_z_0 = sigma_z;
  
  console.log("Start value: " + sigma_x_0 + ", " + sigma_y_0 + ", " + sigma_z_0);

  var dt = 0.01; //0.0001;
  update_sigmas(sigma_x_0, sigma_y_0, sigma_x_0, sigma_y_0, sigma_z_0, dt, 0.0, meas_vec);
}

function update_sigmas(sigma_x, sigma_y, sigma_x_0, sigma_y_0, sigma_z_0, dt, t, meas_vec) {
  document.getElementById("sigma_x_exp").innerHTML = "sigma_x (exp) = " + sigma_x;
  document.getElementById("sigma_y_exp").innerHTML = "sigma_y (exp) = " + sigma_y;
  document.getElementById("sigma_x2_plus_y2_exp").innerHTML = "sigma_x^2 + sigma_y^2 (exp) = " + (sigma_x*sigma_x + sigma_y*sigma_y);
  document.getElementById("sigma_x2_plus_y2_th").innerHTML = "sigma_x^2 + sigma_y^2 (th) = " + (sigma_x_0*sigma_x_0 + sigma_y_0*sigma_y_0);

    var sigma_x_new = sigma_x, sigma_y_new = sigma_y; 
    sigma_x_new -= sigma_y_new*dt;
    sigma_y_new += sigma_x_new*dt;

    //update_anim([sigma_x_new, sigma_y_new, sigma_z_0], meas_vec.arraySync());
    update_anim2([sigma_x_new, sigma_y_new, sigma_z_0]);

    var new_t = t + dt;
    setTimeout(function() { update_sigmas(sigma_x_new, sigma_y_new, sigma_x_0, sigma_y_0, sigma_z_0, dt, new_t, meas_vec)}, 0.01);
}
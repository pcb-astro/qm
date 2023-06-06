var default_spin_vec = angle_to_unit_vec(pi/4.0, pi/4.0);
state_vec = default_spin_vec;
var magnetic_field_vec = init_vec;

document.addEventListener("DOMContentLoaded", function(event) {    
    update_state(state_vec, null);
    update_measurement(null, measure_vec);
  });

document.addEventListener("DOMContentLoaded", function(event) { 
    console.log(state_vec.arraySync(), magnetic_field_vec.arraySync());
    viz_init(state_vec.arraySync(), measure_vec.arraySync(), view3=true, mfvec=magnetic_field_vec.arraySync());
    //viz_init2(state_vec.arraySync(), measure_vec.arraySync());
  });

  function set_spin_direction_v3(){
      var spin_vec = get_measure_vec();
      
      update_state(spin_vec, null);
      align_measurement();
  }

  function reset_direction_v3() {
    document.getElementById("alpha_text").value = 45;
    document.getElementById("beta_text").value = 45;
    
    update_state(default_spin_vec, null);
    align_measurement();  
}
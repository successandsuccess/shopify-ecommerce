const $accordions = [...document.querySelectorAll('.product__accordion details')];
$accordions.forEach($accordion =>{ 
    $accordion.addEventListener('click', function(){ 
        $accordions.filter($acc => $acc !== this).forEach($acc => $acc.removeAttribute('open'));
    })
});
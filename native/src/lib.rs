use neon::prelude::*;
use rand::Rng;

fn quicksort(arr: &mut [i32]) {
    if arr.len() <= 1 {
        return;
    }
    let pivot = partition(arr);
    let (left, right) = arr.split_at_mut(pivot);
    quicksort(left);
    quicksort(&mut right[1..]);
}

fn partition(arr: &mut [i32]) -> usize {
    let pivot = arr.len() - 1;
    let mut i = 0;
    for j in 0..pivot {
        if arr[j] <= arr[pivot] {
            arr.swap(i, j);
            i += 1;
        }
    }
    arr.swap(i, pivot);
    i
}

fn sort(mut cx: FunctionContext) -> JsResult<JsArray> {
    let js_array = cx.argument::<JsArray>(0)?;
    let mut vec: Vec<i32> = js_array.to_vec(&mut cx)?
        .into_iter()
        .map(|val| val.downcast_or_throw::<JsNumber, _>(&mut cx).map(|num| num.value() as i32))
        .collect::<NeonResult<Vec<i32>>>()?;
    
    quicksort(&mut vec);

    let js_result = JsArray::new(&mut cx, vec.len() as u32);
    for (i, &val) in vec.iter().enumerate() {
        let js_number = cx.number(val as f64);
        js_result.set(&mut cx, i as u32, js_number)?;
    }

    Ok(js_result)
}

// 计算圆周率

fn estimate_pi(num_samples: u32) -> f64 {
    let mut rng = rand::thread_rng();
    let mut inside_circle = 0;

    for _ in 0..num_samples {
        let x: f64 = rng.gen();
        let y: f64 = rng.gen();
        if x * x + y * y <= 1.0 {
            inside_circle += 1;
        }
    }

    (inside_circle as f64 / num_samples as f64) * 4.0
}

fn calculate_pi(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let num_samples = cx.argument::<JsNumber>(0)?.value() as u32;
    let pi = estimate_pi(num_samples);
    Ok(cx.number(pi))
}

register_module!(mut cx, {
    cx.export_function("sort", sort)?;
    cx.export_function("calculate_pi", calculate_pi)
});
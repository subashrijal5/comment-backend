<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class RelativePath implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/^\/?(?!\/)(?!.*\/\/)(?!.*\.\.)(?!.*\\\)(?!.*[?#])[a-zA-Z0-9\/\-_ ]+\/?$/', $value)) {
            $fail('The ' . $attribute . ' must be a valid relative path.');
        }
    }
}

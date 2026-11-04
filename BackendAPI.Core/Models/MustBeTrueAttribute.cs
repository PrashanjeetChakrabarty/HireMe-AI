using System;
using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Core.Models;

// Checks that a bool is true, for example a tick box that has to be ticked.
[AttributeUsage(AttributeTargets.Property)]
public class MustBeTrueAttribute : ValidationAttribute
{
    public override bool IsValid(object? value) => value is true;
}
